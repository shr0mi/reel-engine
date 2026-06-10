from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from database import supabase
from productAdsPhonkAgent import generate_climax_script, ScriptResponse, ScriptRequest
from productAdsPhonkTTS import process_tts_and_upload, AudioRequest, AudioResponse
from productAdsPhonkGenImageAgent import generate_product_images
from pydantic import BaseModel
import uuid
import os
import asyncio

router = APIRouter(
    tags=['product ads']
)

# supabase bucket name
AUDIO_BUCKET = "videos"

# A clean way to map IDs to filenames and metadata for easy expansion later
TRACK_DATA = {
    1: {
        "filename": "phonk1.mp3",
        "climax_point": 26
    },
    # You can easily add more tracks here later:
    # 2: {"filename": "lofi_beat.mp3", "climax_point": 45}
}



@router.get("/test")
def test():
    return {"message": "Product Ads router is working!"}

@router.get("/get-phonk-audio")
async def get_audio(id: int = Query(1, description="The ID of the audio track to retrieve")):
    # 1. Check if the requested ID exists in our tracking mapping
    if id not in TRACK_DATA:
        raise HTTPException(
            status_code=404, 
            detail=f"Track with ID {id} not found."
        )
    
    track_info = TRACK_DATA[id]
    file_name = track_info["filename"]
    climax_point = track_info["climax_point"]
    
    try:
        # 2. Grab the public URL from your Supabase bucket
        # Note: If your bucket is private, you would use .create_signed_url() instead
        public_url_res = supabase.storage.from_(AUDIO_BUCKET).get_public_url(file_name)
        
        # 3. Return the exact JSON structure required
        return {
            "id": id,
            "audio_url": public_url_res,
            "climax_point": climax_point
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Cloud storage connection error: {str(e)}"
        )
    
@router.post("/generate-script", response_model=ScriptResponse)
async def create_reel_script(request: ScriptRequest):
    """
    Fetches brand configuration data from Supabase and hands it over to 
    the PydanticAI wrapper engine to output a production-ready script.
    """
    # 1. Fetch brand context from Supabase (ID = 1)
    response = (
        supabase.table("brand_profiles")
        .select("*")
        .eq("id", 1)
        .execute()
    )
    
    if not response.data:
        raise HTTPException(
            status_code=404, 
            detail="Primary brand profile record missing from Supabase."
        )
        
    brand_data = response.data[0]

    try:
        # 2. Invoke the PydanticAI agent execution loop
        script_output = await generate_climax_script(
            brand_details=brand_data,
            topic_prompt=request.topic_prompt,
            language=request.language
        )
        return script_output
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Script generation failed: {str(e)}"
        )
    
@router.post("/generate-audio", response_model=AudioResponse)
async def generate_audio(request: AudioRequest):
    try:
        # Pass both script text and language choice to the processor
        result = await process_tts_and_upload(request.script, request.language)
        return result
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio processing workflow failed: {str(e)}")
    
IMAGE_BUCKET_NAME = "images"

# Response Schema
class ImageUploadResponse(BaseModel):
    image1_url: str
    image2_url: str
    image3_url: str
    image4_url: str
    image5_url: str

async def upload_to_supabase(file: UploadFile) -> str:
    """
    Renames and uploads a single file to Supabase storage without validation.
    """
    # Extract the extension simply to keep it in the new filename
    _, ext = os.path.splitext(file.filename)
    
    # Construct the unique filename requested
    unique_suffix = uuid.uuid4().hex
    target_filename = f"productAdsPhonkImage_{unique_suffix}{ext}"
    
    try:
        # Read raw stream directly into bytes
        file_bytes = await file.read()
        
        # Upload straight to the storage bucket
        supabase.storage.from_(IMAGE_BUCKET_NAME).upload(
            path=target_filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Return public CDN link
        return supabase.storage.from_(IMAGE_BUCKET_NAME).get_public_url(target_filename)

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to upload asset '{file.filename}': {str(e)}"
        )


from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

@router.post("/api/upload-ads-images", response_model=ImageUploadResponse)
async def upload_ads_images(files: List[UploadFile] = File(...)):
    """
    Accepts a dynamic list of files (up to 5) under the key 'files'
    """
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="You can upload a maximum of 5 images.")

    # Upload only the files that were actually sent
    urls = []
    for file in files:
        url = await upload_to_supabase(file)
        urls.append(url)

    # Construct the payload dynamically. Fill remaining fields with empty strings or None 
    # if the user uploaded fewer than 5 images.
    return {
        "image1_url": urls[0] if len(urls) > 0 else "",
        "image2_url": urls[1] if len(urls) > 1 else "",
        "image3_url": urls[2] if len(urls) > 2 else "",
        "image4_url": urls[3] if len(urls) > 3 else "",
        "image5_url": urls[4] if len(urls) > 4 else "",
    }

# Generate Image endpoint
# ---------------------------------------------------------------------------
# Supabase upload helper
# ---------------------------------------------------------------------------
 
async def _upload_to_supabase(data: bytes) -> str:
    """Upload raw PNG bytes to Supabase storage and return the public URL."""
    target_filename = f"productAdsPhonkImage_{uuid.uuid4().hex}.png"
 
    try:
        supabase.storage.from_(IMAGE_BUCKET_NAME).upload(
            path=target_filename,
            file=data,
            file_options={"content-type": "image/png"},
        )
        return supabase.storage.from_(IMAGE_BUCKET_NAME).get_public_url(
            target_filename
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload generated image: {e}",
        )
 
# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
 
@router.post("/api/generate-product-ads", response_model=ImageUploadResponse)
async def generate_product_ads(
    image: UploadFile = File(..., description="Product reference image (jpg/png/webp)"),
    description: str = File(..., description="Free-text product description"),
):
    """
    Accepts a product image and description, generates 5 AI ad images
    (1080x1920), uploads them to Supabase, and returns their public URLs.
    """
    image_bytes = await image.read()
    content_type = image.content_type or "image/jpeg"
 
    try:
        generated_images = await generate_product_images(
            image_bytes=image_bytes,
            image_content_type=content_type,
            description=description,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {e}")
 
    urls: list[str] = await asyncio.gather(
        *[_upload_to_supabase(img) for img in generated_images]
    )
 
    return ImageUploadResponse(
        image1_url=urls[0],
        image2_url=urls[1],
        image3_url=urls[2],
        image4_url=urls[3],
        image5_url=urls[4],
    )