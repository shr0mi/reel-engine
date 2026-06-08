from fastapi import APIRouter, HTTPException, Query
from database import supabase
from productAdsPhonkAgent import generate_climax_script, ScriptResponse, ScriptRequest
from productAdsPhonkTTS import process_tts_and_upload, AudioRequest, AudioResponse

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