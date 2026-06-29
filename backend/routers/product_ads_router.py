from fastapi import APIRouter, HTTPException, Query, UploadFile, File
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

# ---------------------------------------------------------------------------
# Local "phonk" track catalog
# ---------------------------------------------------------------------------
# Filenames are assumed to live under: backend/temp-phonks/
# (directory is gitignored — files are dropped in manually)
PHONK_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "temp-phonks",
)

# ID -> { filename, climax_point }. Easy to expand later.
TRACK_DATA = {
    1: {
        "filename": "phonk1.mp3",
        "climax_point": 26,
    },
    # 2: {"filename": "lofi_beat.mp3", "climax_point": 45},
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
            detail=f"Track with ID {id} not found.",
        )

    track_info = TRACK_DATA[id]
    file_name = track_info["filename"]
    climax_point = track_info["climax_point"]

    # 2. Resolve the local path under backend/temp-phonks/
    file_path = os.path.join(PHONK_DIR, file_name)

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"Audio file '{file_name}' not found in temp-phonks directory.",
        )

    # 3. Return the JSON structure — points at the file on disk
    return {
        "id": id,
        "audio_url": file_path,
        "climax_point": climax_point,
    }


@router.post("/generate-script", response_model=ScriptResponse)
async def create_reel_script(request: ScriptRequest):
    """
    Loads brand configuration data from the local temp-phonks directory
    metadata file and hands it over to the PydanticAI wrapper engine to
    output a production-ready script.
    """
    # 1. Load brand context from local temp-phonks metadata (ID = 1)
    brand_data = _load_brand_profile(profile_id=1)

    try:
        # 2. Invoke the PydanticAI agent execution loop
        script_output = await generate_climax_script(
            brand_details=brand_data,
            topic_prompt=request.topic_prompt,
            language=request.language,
        )
        return script_output

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Script generation failed: {str(e)}",
        )


def _load_brand_profile(profile_id: int = 1) -> dict:
    """
    Reads the primary brand profile from backend/temp-phonks/brand_profiles.json.

    The file is expected to be a JSON array of objects, e.g.:
        [
            {
                "id": 1,
                "brand_name": "Acme",
                "tone": "high-energy",
                ...
            }
        ]
    """
    profile_path = os.path.join(PHONK_DIR, "brand_profiles.json")

    if not os.path.isfile(profile_path):
        raise HTTPException(
            status_code=404,
            detail="Primary brand profile record missing from temp-phonks directory.",
        )

    import json

    with open(profile_path, "r", encoding="utf-8") as fp:
        profiles = json.load(fp)

    for profile in profiles:
        if profile.get("id") == profile_id:
            return profile

    raise HTTPException(
        status_code=404,
        detail=f"Brand profile with id={profile_id} not found in temp-phonks.",
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


# ---------------------------------------------------------------------------
# Image generation / upload
# ---------------------------------------------------------------------------
# We keep the image-upload helper local — instead of pushing bytes to Supabase,
# we drop them under backend/temp-phonks/ and return a path-style URL.
IMAGE_DIR_NAME = "images"
IMAGE_BUCKET_NAME = os.path.join(PHONK_DIR, IMAGE_DIR_NAME)


class ImageUploadResponse(BaseModel):
    image1_url: str
    image2_url: str
    image3_url: str
    image4_url: str
    image5_url: str


async def upload_to_supabase(file: UploadFile) -> str:
    """
    Saves an uploaded file into the local temp-phonks/images/ directory
    under a unique filename, and returns its on-disk path.
    """
    _, ext = os.path.splitext(file.filename)

    # Construct the unique filename requested
    unique_suffix = uuid.uuid4().hex
    target_filename = f"productAdsPhonkImage_{unique_suffix}{ext}"
    target_path = os.path.join(IMAGE_BUCKET_NAME, target_filename)

    try:
        os.makedirs(IMAGE_BUCKET_NAME, exist_ok=True)

        # Read raw stream directly into bytes
        file_bytes = await file.read()

        with open(target_path, "wb") as out_file:
            out_file.write(file_bytes)

        return target_path

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save asset '{file.filename}': {str(e)}",
        )


from fastapi import APIRouter, UploadFile, File, HTTPException  # noqa: E402
from typing import List  # noqa: E402


@router.post("/api/upload-ads-images", response_model=ImageUploadResponse)
async def upload_ads_images(files: List[UploadFile] = File(...)):
    """
    Accepts a dynamic list of files (up to 5) under the key 'files'
    """
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="You can upload a maximum of 5 images.")

    # Save only the files that were actually sent
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
# Local save helper
# ---------------------------------------------------------------------------

async def _upload_to_supabase(data: bytes) -> str:
    """Save raw PNG bytes to temp-phonks/images/ and return the file path."""
    target_filename = f"productAdsPhonkImage_{uuid.uuid4().hex}.png"
    target_path = os.path.join(IMAGE_BUCKET_NAME, target_filename)

    try:
        os.makedirs(IMAGE_BUCKET_NAME, exist_ok=True)
        with open(target_path, "wb") as out_file:
            out_file.write(data)
        return target_path
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save generated image: {e}",
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
    (1080x1920), saves them locally under temp-phonks/images/, and
    returns their file paths.
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