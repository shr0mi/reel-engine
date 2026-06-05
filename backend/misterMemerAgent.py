import os, json
import numpy as np
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

from sentence_transformers import SentenceTransformer
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.models.google import GoogleModelSettings
from pydantic import Field

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY")

# ====================== MEME DB + EMBEDDINGS ======================

with open("memedb.json") as f:
    MEME_DB = json.load(f)

_embedder = SentenceTransformer("all-MiniLM-L6-v2")

_template_strings = [f"{m['vibe']} {m.get('ex_bottom', '')}" for m in MEME_DB]
_template_embeddings = _embedder.encode(_template_strings, normalize_embeddings=True)

def _template_summary(m: dict) -> str:
    # Absolute minimum: id | vibe | structure rule | example top > bottom
    return f"{m['id']}|{m['vibe']}|{m.get('structure','')}|{m.get('ex_top','')}>{m.get('ex_bottom','')}"

def retrieve_top_templates(query: str, top_k: int = 3) -> list[dict]:
    q = _embedder.encode([query], normalize_embeddings=True)
    scores = np.dot(_template_embeddings, q.T).flatten()
    return [MEME_DB[i] for i in np.argsort(scores)[::-1][:top_k]]


# ====================== SCHEMA ======================

class MemeOutput(BaseModel):
    template_id: int = Field(description="ID of the selected meme template from the database.-1 if user image upload")
    top_text: str = Field(description="Text to be placed at the top of the meme image.Max 15 words.")
    bottom_text: str = Field(description="Text to be placed at the bottom of the meme image. Max 15 words.")


# ====================== AGENT ======================

memer_agent = Agent(
    model=GoogleModel("gemini-2.5-flash", provider=GoogleProvider(api_key=GEMINI_API_KEY)),
    output_type=MemeOutput,
    
    # ~120 token system prompt — every word earns its place
    instructions=(
        "You are a Professional Meme caption engine for Bangladeshi audience.\n"
        "IMG| Generate:TOP = setup BOTTOM = punchline.Max 15 words each.Simple texting language.Return JSON only.\n"
        "TMPL: pick the best ID by vibe that matches with the topic, follow Structure exactly, mirror example rhythm, "
        "English or Banglish ,whichever is more preferable.Texting tone."
        "Output ONLY: {template_id: int, top_text: str, bottom_text: str}"
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
        # ~30 tokens of user prompt
        prompt = f"IMG|AUD:{brand_summary}|TOPIC:{topic_prompt}"
    else:
        top_templates = retrieve_top_templates(topic_prompt, top_k=3)
        # Each template summary ~25 tokens; 3 = ~75 tokens total
        tmpl_block = "\n".join(_template_summary(t) for t in top_templates)
        prompt = f"TMPL|AUD:{brand_summary}|TOPIC:{topic_prompt}\n{tmpl_block}"


    print(prompt)
    print("Chars:", len(prompt))
    print("Words:", len(prompt.split()))
    print("MEME AGENT START")
    result = await memer_agent.run(prompt)
    print("MEME AGENT END")
    print(result.usage())
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