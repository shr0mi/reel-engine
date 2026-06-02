from fastapi import APIRouter, HTTPException
from database import supabase
from pydantic import BaseModel, Field
from typing import Literal
from reelWriterAgent import generate_reel_script, ScriptResponse

class ScriptRequest(BaseModel):
    prompt: str = Field(default="", description="The specific topic or concept. Leave blank for a random generation.")
    language: Literal["en", "ban"] = Field(..., description="Language configuration: 'en' for English, 'ban' for Bangla.")
    duration: int = Field(..., description="Target duration in seconds (e.g., 60).")

router = APIRouter(
    tags=['text to reel']
)

@router.get("/test")
def test():
    return {"message": "Text to Reel router is working!"}

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
        raise HTTPException(status_code=404, detail="Primary brand profile record missing from Supabase.")
        
    brand_data = response.data[0]

    try:
        # 2. Invoke the PydanticAI execution loop
        script_output = await generate_reel_script(
            brand_details=brand_data,
            topic_prompt=request.prompt,
            language=request.language,
            duration=request.duration
        )
        return script_output
        
    except Exception as e:
        # Gracefully capture schema mismatches or LLM dropouts
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")