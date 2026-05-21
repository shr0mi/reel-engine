import os
import shutil
from datetime import timedelta
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from faster_whisper import WhisperModel
from fastapi.middleware.cors import CORSMiddleware
import io
import srt
from pathlib import Path

# Initialize the FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # You can use ["*"] for quick testing (not recommended for production)
    allow_credentials=True,       # Important if you use cookies or auth later
    allow_methods=["*"],          # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],          # Allow all headers (like Content-Type)
)

# A simple GET endpoint for testing
@app.get("/")
def read_root():
    return {
        "message": "Hello World!",
        "status": "FastAPI is running perfectly!"
    }

# Create a permanent storage directory for your videos
UPLOAD_DIR = "stored_videos"
UPLOAD_SRT = "stored_srt"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_SRT, exist_ok=True)

# Initialize Faster-Whisper. 
# Using "small" for speed/efficiency on 16GB RAM. 
# Running on CPU for Apple Silicon (int8 quantization keeps memory footprint tiny)
MODEL_SIZE = "small"
print(f"Loading Whisper model ({MODEL_SIZE})...")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
print("Model loaded successfully!")

def format_srt_time(seconds: float) -> str:
    """Converts seconds into SRT timestamp format: HH:MM:SS,mmm"""
    td = timedelta(seconds=seconds)
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    milliseconds = int((seconds - total_seconds) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"

@app.post("/transcribe/")
async def transcribe_video(file: UploadFile = File(...)):
    # 1. Validate that it's a video file (basic check)
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a video.")

    # 2. Save the video file permanently
    ext = os.path.splitext(file.filename)[1] # get the file extension (e.g., .mp4, .mkv)
    #print(ext)
    video_path = os.path.join(UPLOAD_DIR, f"video{ext}")
    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    try:
        # 3. Run Faster-Whisper transcription directly on the saved video path
        # (Whisper internally extracts the audio track using ffmpeg bindings)
        segments, info = model.transcribe(video_path, beam_size=5)

        # 4. Build the SRT file structure in memory
        srt_content = []
        for i, segment in enumerate(segments, start=1):
            start_time = format_srt_time(segment.start)
            end_time = format_srt_time(segment.end)
            text = segment.text.strip()
            
            srt_content.append(f"{i}\n{start_time} --> {end_time}\n{text}\n\n")

        full_srt_string = "".join(srt_content)

        # 5. Return the SRT file as an inline downloadable file attachment
        # This converts our raw string into a byte stream for FastAPI to send over HTTP
        file_stream = io.BytesIO(full_srt_string.encode("utf-8"))
        srt_filename = f"{os.path.splitext(file.filename)[0]}.srt"

        # Store SRT permanently
        srt_path = os.path.join(UPLOAD_SRT, "video.srt")
        try:
            # Open in text mode ("w") with utf-8 encoding to save the string directly
            with open(srt_path, "w", encoding="utf-8") as buffer:
                buffer.write(full_srt_string)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save SRT: {str(e)}")

        return StreamingResponse(
            file_stream,
            media_type="text/srt",
            headers={"Content-Disposition": f"attachment; filename={srt_filename}"}
        )

    except Exception as e:
        # If transcription fails, we still kept the video, but we should inform the user
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    

# Send video file to frontend
@app.get("/api/video")
async def get_video():
    video_path = os.path.join(UPLOAD_DIR, "video.mp4")  # get video from stored_videos
    # Verify the file actually exists to avoid a 500 error
    if not os.path.exists(video_path):
        return {"error": "Video file not found"}, 404
    
    # FileResponse automatically handles HTTP Range requests required for video player scrubbing
    return FileResponse(video_path, media_type="video/mp4")


# We will first format the SRT into our preferred JSON structure on the backend, then send that to the frontend for easier handling
srt_file_path = Path(os.path.join(UPLOAD_SRT, "video.srt"))
@app.get("/api/captions")
def get_parsed_captions():
    if not os.path.exists(srt_file_path):
        return {"error": "SRT file not found"}, 404
    
    try:
        # 2. Read the raw SRT file content
        srt_content = srt_file_path.read_text(encoding="utf-8")
        
        # 3. Parse it into a generator using the srt library
        parsed_subtitle_generator = srt.parse(srt_content)
        
        segments = []
        for sub in parsed_subtitle_generator:
            # Convert timedelta objects directly into total seconds as a float
            start_seconds = sub.start.total_seconds()
            end_seconds = sub.end.total_seconds()
            
            # Clean up the text (remove unnecessary newlines introduced by raw SRT)
            clean_text = sub.content.replace("\n", " ").strip()
            
            segments.append({
                "id": sub.index,
                "start": round(start_seconds, 3),
                "end": round(end_seconds, 3),
                "text": clean_text
            })
            
        # 4. Construct the complete response format with default global design values
        payload = {
            "videoUrl": "http://localhost:8000/static/video.mp4", # Fallback or static reference
            "globalStyles": {
                "fontFamily": "Impact",
                "fontSize": 40,
                "primaryColor": "#FFFF00",
                "strokeColor": "#000000",
                "strokeWidth": 4,
                "positionY": 75  # 75% down the screen by default
            },
            "segments": segments
        }
        
        return payload

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse SRT file: {str(e)}")