import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file at the root
load_dotenv()

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
PEXELS_URL = "https://api.pexels.com/videos/search"

def fetch_pexels_videos(query: str, per_page: int = 10) -> list:
    """
    Fetches top horizontal videos between 5 and 10 seconds long 
    for a given query from the Pexels API.
    """
    if not PEXELS_API_KEY:
        print("Warning: PEXELS_API_KEY not found in environment variables.")
        return []

    headers = {"Authorization": PEXELS_API_KEY}
    
    # Added orientation, min_duration, and max_duration parameters
    params = {
        "query": query,
        "per_page": per_page,
        "orientation": "portrait",  # Restricts results to horizontal videos
        "min_duration": 5,           # Minimum duration in seconds
        "max_duration": 10           # Maximum duration in seconds
    }

    try:
        response = requests.get(PEXELS_URL, headers=headers, params=params)
        response.raise_for_status()
        raw_videos = response.json().get("videos", [])
        #return data.get("videos", [])
    
        processed_videos = []
        for v in raw_videos:
            video_files = v.get("video_files", [])
            
            # Find a video file that specifically matches 1080x1920
            target_file = next(
                (f for f in video_files if f.get("width") == 1080 and f.get("height") == 1920), 
                None
            )
            
            # Fallback: if exact match isn't found, pick the largest file available
            if not target_file and video_files:
                target_file = max(video_files, key=lambda f: f.get("width", 0))
            
            if target_file:
                # Build a clean dictionary to pass back to your API response
                processed_videos.append({
                    "id": v.get("id"),
                    "duration": v.get("duration"),
                    "url": v.get("url"),
                    "download_link": target_file.get("link"),
                    "width": target_file.get("width"),
                    "height": target_file.get("height")
                })
                
        return processed_videos
    
    except Exception as e:
        print(f"Error fetching videos for '{query}': {e}")
        return []