import os
import io
import shutil
from pathlib import Path
from typing import List
from datetime import timedelta

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import srt
from faster_whisper import WhisperModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# 1. Initialize Supabase Client
# In production, use os.environ.get("SUPABASE_URL") after loading a dotenv file.
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

print(f"Supabase URL: {SUPABASE_URL}")
print(f"Supabase Key: {SUPABASE_KEY}")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "videos"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges"],
)

# Keep local TEMP dirs just for whisper's processing workspace
TEMP_DIR = "temp_processing"
os.makedirs(TEMP_DIR, exist_ok=True)

MODEL_SIZE = "small"
print(f"Loading Whisper model ({MODEL_SIZE})...")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
print("Model loaded successfully!")

def format_srt_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

@app.post("/transcribe/")
async def transcribe_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a video.")

    # We still need a temporary file locally because Faster-Whisper needs a file path to parse via ffmpeg
    temp_video_path = os.path.join(TEMP_DIR, f"temp_video.mp4")
    
    try:
        with open(temp_video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write local temporary file: {str(e)}")

    try:
        # --- SUPABASE STORAGE UPLOAD ---
        # Read the local temp file bytes to send to Supabase
        with open(temp_video_path, "rb") as f:
            file_bytes = f.read()
        
        # Uploading to bucket with 'upsert=true' to replace any existing file instantly
        supabase.storage.from_(BUCKET_NAME).upload(
            path="video.mp4",
            file=file_bytes,
            file_options={"content-type": "video/mp4", "upsert": "true"}
        )

        # 3. Run Faster-Whisper transcription on our local temp file
        segments, info = model.transcribe(
            temp_video_path,
            word_timestamps=True,
            condition_on_previous_text=False
        )

        # 4. Build the SRT file structure in memory
        srt_content = []
        max_words_per_caption = 3
        srt_index = 1

        for segment in segments:
            words = list(segment.words)
            if not words:
                continue

            for i in range(0, len(words), max_words_per_caption):
                chunk_words = words[i:i + max_words_per_caption]
                start_time = format_srt_time(chunk_words[0].start)
                end_time = format_srt_time(chunk_words[-1].end)
                text = " ".join(word.word.strip() for word in chunk_words).strip()
                srt_content.append(f"{srt_index}\n{start_time} --> {end_time}\n{text}\n\n")
                srt_index += 1

        full_srt_string = "".join(srt_content)

        # Upload the SRT string to Supabase Storage as bytes (with upsert enabled)
        srt_bytes = full_srt_string.encode("utf-8")
        supabase.storage.from_(BUCKET_NAME).upload(
            path="video.srt",
            file=srt_bytes,
            file_options={"content-type": "text/plain", "upsert": "true"}
        )

        # Cleanup local temporary video file to keep the disk clear
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

        # 5. Return the SRT file stream response back to frontend client
        file_stream = io.BytesIO(srt_bytes)
        srt_filename = f"{os.path.splitext(file.filename)[0]}.srt"

        return StreamingResponse(
            file_stream,
            media_type="text/srt",
            headers={"Content-Disposition": f"attachment; filename={srt_filename}"}
        )

    except Exception as e:
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        raise HTTPException(status_code=500, detail=f"Transcription or cloud upload failed: {str(e)}")


@app.get("/api/video")
async def get_video():
    try:
        # Since your bucket is public, we can grab the direct public URL from Supabase
        # This completely unburdens FastAPI from serving heavy video streams!
        public_url_res = supabase.storage.from_(BUCKET_NAME).get_public_url("video.mp4")
        
        # Redirect the frontend video player element directly to the Supabase CDN URL
        return RedirectResponse(url=public_url_res)
    except Exception as e:
        return {"error": f"Could not retrieve video from cloud storage: {str(e)}"}, 404


@app.get("/api/captions")
def get_parsed_captions():
    try:
        # Download the SRT directly from your Supabase bucket into memory
        srt_bytes = supabase.storage.from_(BUCKET_NAME).download("video.srt")
        srt_content = srt_bytes.decode("utf-8")
        
        parsed_subtitle_generator = srt.parse(srt_content)
        
        segments = []
        for sub in parsed_subtitle_generator:
            start_seconds = sub.start.total_seconds()
            end_seconds = sub.end.total_seconds()
            clean_text = sub.content.replace("\n", " ").strip()
            
            segments.append({
                "id": sub.index,
                "start": round(start_seconds, 3),
                "end": round(end_seconds, 3),
                "text": clean_text
            })
            
        payload = {
            "videoUrl": supabase.storage.from_(BUCKET_NAME).get_public_url("video.mp4"),
            "globalStyles": {
                "fontFamily": "Impact",
                "fontSize": 40,
                "primaryColor": "#FFFF00",
                "strokeColor": "#000000",
                "strokeWidth": 4,
                "positionY": 75
            },
            "segments": segments
        }
        return payload

    except Exception as e:
        return {"error": f"SRT file not found or corrupted: {str(e)}"}, 404

class Segment(BaseModel):
    id: int
    start: float
    end: float
    text: str

@app.post("/segments")
async def receive_segments(segments: List[Segment]):
    for segment in segments:
        print(f"Processing segment {segment.id}: {segment.text}")
    return {"status": "success", "message": f"Successfully processed {len(segments)} segments."}