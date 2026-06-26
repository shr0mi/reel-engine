from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from fetchVideos import fetch_pexels_videos
from pydantic import BaseModel, Field
from typing import Any, Literal, List
from reelWriterAgent import generate_reel_script, ScriptResponse
from text_to_reel_tts import generate_voiceover, ReelDataResponse, StoryBlockTiming
import os
import sqlite3

class ScriptRequest(BaseModel):
    prompt: str = Field(default="", description="The specific topic or concept. Leave blank for a random generation.")
    language: Literal["en", "bn"] = Field(..., description="Language configuration: 'en' for English, 'bn' for Bangla.")
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
    Fetches brand configuration data from the local brand_profile.db SQLite
    database and hands it over to the PydanticAI wrapper engine to output a
    production-ready script.
    """
    # 1. Fetch brand context from local SQLite (ID = 1)
    db_path = os.path.join(os.path.dirname(__file__), "..", "brand_profile.db")
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM brand_profiles WHERE id = ?",
            (1,),
        )
        row = cursor.fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Primary brand profile record missing from local DB.")

    brand_data = dict(row)

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
    

class GenerateAudioResponse(ReelDataResponse):
    success: bool
    
@router.post("/generate-audio", response_model=GenerateAudioResponse)
async def create_reel_audio(script: ScriptResponse, language: str = "en"):
    """
    Accepts a generated script response, processes TTS in memory, 
    overwrites the static file in Supabase, and returns its public URL.
    """
    try:
        # Generate and upload entirely in memory
        reel_data: ReelDataResponse = await generate_voiceover(script=script, language=language)
        
        return GenerateAudioResponse(
            success=True,
            **reel_data.model_dump()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio pipeline failed: {str(e)}")
    
# Fetch and organize video results from pexels API according to the search terms
class FetchVideosRequest(BaseModel):
    story_blocks: list[StoryBlockTiming]

class FetchVideosOutput(StoryBlockTiming):
    videos_per_prompt: List[List[Any]]

class FetchVideosResponse(BaseModel):
    story_blocks: List[FetchVideosOutput]

@router.post("/fetch-videos", response_model=FetchVideosResponse)
def process_story_blocks(payload: FetchVideosRequest):
    output_blocks = []

    for block in payload.story_blocks:
        results_by_term = []
        
        # 1. Fetch top 10 videos for each term in the prompt
        for term in block.visual_prompt:
            videos = fetch_pexels_videos(term, per_page=10)
            results_by_term.append(videos)
        
        # 3. Construct the output block with the new field
        output_block = FetchVideosOutput(
            paragraph_id=block.paragraph_id,
            start=block.start,
            end=block.end,
            visual_prompt=block.visual_prompt,
            videos_per_prompt=results_by_term
        )
        output_blocks.append(output_block)

    return FetchVideosResponse(story_blocks=output_blocks)

