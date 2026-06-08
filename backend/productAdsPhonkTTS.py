import uuid
import edge_tts
from database import supabase  # Your initialized Supabase client
from pydantic import BaseModel, Field
from typing import List

class AudioRequest(BaseModel):
    script: str = Field(..., description="The textual script to convert to speech.")
    language: str = Field("en", description="Language code selection: 'en' for English or 'bn' for Bangla.")

class CaptionSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str

class AudioResponse(BaseModel):
    tts_audio_url: str
    tts_audio_duration: float
    caption: List[CaptionSegment]


BUCKET_NAME = "videos"

# 1. Map incoming language keys to high-quality neural voices
VOICE_MAPPING = {
    "en": "en-US-AndrewNeural",  # Energetic, clean modern English voice
    "bn": "bn-BD-PradeepNeural"        # Natural-sounding Bangla voice
}

async def process_tts_and_upload(script_text: str, language: str) -> dict:
    """
    Generates an mp3 from text using edge-tts with language selection, 
    captures word boundaries, chunks captions into 3-word blocks, 
    and uploads the artifact with a unique file name to Supabase.
    """
    # Normalize language string and fall back safely to English if unrecognized
    selected_voice = VOICE_MAPPING.get(language.strip().lower(), "en-US-ChristopherNeural")
    
    # 2. Initialize edge-tts speech pipeline (+25% rate works great for pacing phonk drops)
    communicate = edge_tts.Communicate(
        text=script_text, 
        voice=selected_voice, 
        rate="+15%", 
        boundary="WordBoundary"
    )
    
    audio_bytes = bytearray()
    word_boundaries = []
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            word_boundaries.append(chunk)
            
    if not word_boundaries:
        raise ValueError("The TTS engine did not generate any audio tracks or word boundaries.")
        
    # 3. Extract accurate aggregate duration directly from the final word timestamp
    last_word = word_boundaries[-1]
    total_duration = round((last_word["offset"] + last_word["duration"]) / 10_000_000, 3)
    
    # 4. Generate random unique name string to isolate multi-user calls safely
    unique_suffix = uuid.uuid4().hex
    target_path = f"productAdsPhonkAudio_{unique_suffix}.mp3"
    
    # 5. Stream raw immutable bytes up to the Supabase Cloud Bucket
    supabase.storage.from_(BUCKET_NAME).upload(
        path=target_path,
        file=bytes(audio_bytes),
        file_options={"content-type": "audio/mpeg"}
    )
    
    # 6. Extract CDN delivery URL 
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(target_path)
    
    # 7. Step through word lists in strides of 3 to create the custom caption payload
    captions_list = []
    caption_id = 1
    
    for i in range(0, len(word_boundaries), 3):
        chunk_words = word_boundaries[i : i + 3]
        
        start_secs = round(chunk_words[0]["offset"] / 10_000_000, 3)
        end_secs = round((chunk_words[-1]["offset"] + chunk_words[-1]["duration"]) / 10_000_000, 3)
        chunk_text = " ".join([w["text"] for w in chunk_words])
        
        captions_list.append(
            CaptionSegment(
                id=caption_id,
                start=start_secs,
                end=end_secs,
                text=chunk_text
            )
        )
        caption_id += 1
        
    return {
        "tts_audio_url": public_url,
        "tts_audio_duration": total_duration,
        "caption": captions_list
    }
