# text_to_reel.py
import os
import re
import edge_tts
from reelWriterAgent import ScriptResponse
from pydantic import BaseModel, Field
from typing import List

# Define output models
class CaptionSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str

class StoryBlockTiming(BaseModel):
    paragraph_id: int
    start: float
    end: float
    visual_prompt: List[str]

class ReelDataResponse(BaseModel):
    tone: str
    story_blocks: List[StoryBlockTiming]
    captions: List[CaptionSegment]
    audio_url: str



# Define high-quality neural voices for English and Bangla
VOICE_MAPPING = {
    "en": "en-US-ChristopherNeural",        # Clean, modern English voice
    "bn": "bn-BD-PradeepNeural"   # Natural-sounding Bangla (Bangladesh) voice
}

# Local directory for saving generated audio files
LOCAL_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "temp-text-to-reel")
LOCAL_AUDIO_FILENAME = "text_to_reel_audio.mp3"

async def generate_voiceover(script: ScriptResponse, language: str) -> ReelDataResponse:
    """
    Generates audio in memory using edge-tts and saves it locally to the
    backend/temp-text-to-reel/ folder (overwriting any previous file).
    Creates ReelDataResponse with timing data and captions.
    """
    # 1. Combine all spoken texts smoothly
    full_text = "\n\n".join([block.spoken_text for block in script.story_blocks])
    voice = VOICE_MAPPING.get(language, "en-US-ChristopherNeural")

    # 2. Compile audio chunks directly into a bytearray in memory
    communicate = edge_tts.Communicate(text=full_text, voice=voice, rate="+25%", boundary="WordBoundary")
    audio_bytes = bytearray()
    word_boundaries = []  # To track word-level timing for captions

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            word_boundaries.append(chunk)

    # 3. Convert bytearray to immutable bytes
    final_bytes = bytes(audio_bytes)

    # 4. Save audio locally (overwrite previous file)
    os.makedirs(LOCAL_AUDIO_DIR, exist_ok=True)
    local_file_path = os.path.join(LOCAL_AUDIO_DIR, LOCAL_AUDIO_FILENAME)
    with open(local_file_path, "wb") as f:
        f.write(final_bytes)

    # 5. Return an absolute URL pointing to the FastAPI-served audio file
    backend_base_url = os.getenv("BACKEND_PUBLIC_URL", "http://127.0.0.1:8000").rstrip("/")
    public_url = f"{backend_base_url}/temp-text-to-reel/{LOCAL_AUDIO_FILENAME}"

    # Generate 3 word chunk captions based on word boundaries
    captions = []
    caption_id = 1
    
    for i in range(0, len(word_boundaries), 3):
        chunk_words = word_boundaries[i : i + 3]
        
        # Convert edge-tts 100-ns units to seconds
        start_secs = round(chunk_words[0]["offset"] / 10_000_000, 3)
        end_secs = round((chunk_words[-1]["offset"] + chunk_words[-1]["duration"]) / 10_000_000, 3)
        chunk_text = " ".join([w["text"] for w in chunk_words])
        
        captions.append(
            CaptionSegment(
                id=caption_id,
                text=chunk_text,
                start=start_secs,
                end=end_secs
            )
        )
        caption_id += 1

    
    # Process word boundaries to accurately track paragraph timings
    all_script_words = []
    for idx, block in enumerate(script.story_blocks):
        words = [re.sub(r'[^\w]', '', w).lower() for w in block.spoken_text.split()]
        for w in words:
            if w:
                all_script_words.append((w, idx))
                
    paragraph_data = []
    for block in script.story_blocks:
        paragraph_data.append({
            "paragraph_id": block.paragraph,
            "start": None,
            "end": None,
            "visual_prompt": block.visual_prompt
        })
        
    script_ptr = 0
    current_block_idx = 0
    
    for boundary in word_boundaries:
        w_start = boundary["offset"] / 10_000_000
        w_end = (boundary["offset"] + boundary["duration"]) / 10_000_000
        w_text = re.sub(r'[^\w]', '', boundary["text"]).lower()
        
        if not w_text:
            continue
            
        found_idx = -1
        for k in range(script_ptr, min(script_ptr + 15, len(all_script_words))):
            if all_script_words[k][0] == w_text:
                found_idx = k
                break
                
        if found_idx != -1:
            script_ptr = found_idx + 1
            current_block_idx = all_script_words[found_idx][1]
            
        if paragraph_data[current_block_idx]["start"] is None:
            paragraph_data[current_block_idx]["start"] = w_start
        paragraph_data[current_block_idx]["end"] = w_end

    # Handle timing fallback calculations dynamically
    last_end = 0.0
    story_blocks_timings = []
    for data in paragraph_data:
        if data["start"] is None:
            data["start"] = last_end
        if data["end"] is None or data["end"] < data["start"]:
            data["end"] = data["start"] + 1.0
        last_end = data["end"]
        
        story_blocks_timings.append(
            StoryBlockTiming(
                paragraph_id=data["paragraph_id"],
                start=round(data["start"], 3),
                end=round(data["end"], 3),
                visual_prompt=data["visual_prompt"]
            )
        )
        
    # 6. Build and compile the final schema response
    return ReelDataResponse(
        audio_url=public_url,
        tone=str(script.tone),
        story_blocks=story_blocks_timings,
        captions=captions
    )
