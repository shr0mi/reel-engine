import os
import shutil
from datetime import timedelta
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from faster_whisper import WhisperModel
import io

# Initialize the FastAPI app
app = FastAPI()

# A simple GET endpoint for testing
@app.get("/")
def read_root():
    return {
        "message": "Hello World!",
        "status": "FastAPI is running perfectly!"
    }

# Create a permanent storage directory for your videos
UPLOAD_DIR = "stored_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    video_path = os.path.join(UPLOAD_DIR, file.filename)
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

        return StreamingResponse(
            file_stream,
            media_type="text/srt",
            headers={"Content-Disposition": f"attachment; filename={srt_filename}"}
        )

    except Exception as e:
        # If transcription fails, we still kept the video, but we should inform the user
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")