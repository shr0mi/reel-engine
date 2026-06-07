import os
import json
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from google import genai
from google.genai import types
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY")

# Initialize the new SDK client for embedding retrieval tasks
genai_client = genai.Client(api_key=GEMINI_API_KEY)

# ====================== MEME DB + EMBEDDINGS ======================

CACHE_PATH = "template_embeddings.json"

with open("memedb.json") as f:
    MEME_DB = json.load(f)

if not os.path.exists(CACHE_PATH):
    raise FileNotFoundError(f"CRITICAL: Pre-computed cache missing at {CACHE_PATH}. Run generate_embeddings.py locally first.")

print(f" -> Loading pre-computed Gemini embeddings from {CACHE_PATH}...")
with open(CACHE_PATH) as f:
    _template_embeddings = json.load(f)


def _template_summary(m: dict) -> str:
    return f"{m['id']}|{m['vibe']}|{m.get('structure','')}|{m.get('ex_top','')}>{m.get('ex_bottom','')}"


def pure_python_dot_product(v1: list[float], v2: list[float]) -> float:
    return sum(x * y for x, y in zip(v1, v2))


def retrieve_top_templates(query: str, top_k: int = 3) -> list[dict]:
    # Match model identifier and dimensionality to the document cache
    response = genai_client.models.embed_content(
        model="gemini-embedding-001",
        contents=query,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=768
        )
    )
    q_emb = response.embeddings[0].values
    
    # Calculate similarities using pure Python
    scores = [pure_python_dot_product(tmpl_emb, q_emb) for tmpl_emb in _template_embeddings]
    
    # Sort and pick top_k
    ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return [MEME_DB[i] for i in ranked_indices[:top_k]]


# ====================== SCHEMA ======================

class MemeOutput(BaseModel):
    template_id: int = Field(description="ID of the selected meme template from the database. -1 if user image upload")
    top_text: str = Field(description="Text to be placed at the top of the meme image. Max 15 words.")
    bottom_text: str = Field(description="Text to be placed at the bottom of the meme image. Max 15 words.")


# ====================== AGENT ======================

memer_agent = Agent(
    model=GoogleModel("gemini-2.5-flash", provider=GoogleProvider(api_key=GEMINI_API_KEY)),
    output_type=MemeOutput,
    instructions=(
        """You are a highly creative and witty Meme caption engine tailored for a Bangladeshi audience. 
Avoid being overly rigid or literal—make the memes funny, highly relatable, culturally accurate, and deeply tied to the nuances of the topic prompt.

CORE RULES:
1. IMG Mode: Generate TOP = setup, BOTTOM = punchline. Max 15 words per section. Use casual texting/Banglish language.
2. TMPL Mode: Pick the best matching template ID by its emotional vibe. Follow its structural rules exactly and mimic its rhythm.
3. Tone: Use natural local texting vocabulary (Banglish, English, or conversational Bengali where appropriate).

EXAMPLES OF EXPECTED CREATIVITY & STYLE:
- Topic: About when you get to buy a brand new phone with your own money after using your fathers second hand phone for years and your are feeling so happy and delighted
  Top: Finally got my own phone after abbu's old one
  Bottom: Choto Bhai/Bon: "aita amader phone"

Output ONLY valid JSON matching the schema format: {template_id: int, top_text: str, bottom_text: str}"""
    ),
)


# ====================== CORE ======================

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:8000")

async def generate_meme(
    topic_prompt: str,
    brand_summary: str,
    image_bytes: Optional[bytes] = None,
) -> dict:
    is_image_mode = image_bytes is not None

    if is_image_mode:
        prompt = f"IMG|AUD:{brand_summary}|TOPIC:{topic_prompt}"
    else:
        top_templates = retrieve_top_templates(topic_prompt, top_k=3)
        tmpl_block = "\n".join(_template_summary(t) for t in top_templates)
        prompt = f"TMPL|AUD:{brand_summary}|TOPIC:{topic_prompt}\n{tmpl_block}"

    print("MEME AGENT START")
    result = await memer_agent.run(prompt)
    print("MEME AGENT END")
    meme = result.output

    if is_image_mode:
        return {
            "status": "success",
            "image_source": "user_upload",
            "selected_template": None,
            "top_text": meme.top_text,
            "bottom_text": meme.bottom_text,
            "image_url": "user_upload",
        }

    allowed = {t["id"]: t for t in top_templates}
    selected = allowed.get(meme.template_id, top_templates[0])
    img_filename = os.path.basename(selected.get("img", ""))
    if not img_filename:
        raise ValueError("Template image path missing in memedb.")

    return {
        "status": "success",
        "image_source": "template_database",
        "selected_template": selected["name"],
        "top_text": meme.top_text,
        "bottom_text": meme.bottom_text,
        "image_url": f"{BACKEND_BASE_URL}/templates/{img_filename}",
    }