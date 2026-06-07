import json
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

with open("memedb.json") as f:
    MEME_DB = json.load(f)

print("Encoding meme database templates via gemini-embedding-001...")
template_strings = [f"{m['vibe']} {m.get('ex_bottom', '')}" for m in MEME_DB]

# Configured to use gemini-embedding-001 compressed down to 768 dimensions
response = client.models.embed_content(
    model="gemini-embedding-001",
    contents=template_strings,
    config=types.EmbedContentConfig(
        task_type="RETRIEVAL_DOCUMENT",
        output_dimensionality=768
    )
)

embeddings_data = [emb.values for emb in response.embeddings]

with open("template_embeddings.json", "w") as f:
    json.dump(embeddings_data, f)

print("Saved 768-dimensional template_embeddings.json successfully!")