"""
image_gen_agent.py
------------------
Pydantic AI agent (google:gemini-3-flash-preview) for visual prompt generation
and google-genai SDK (gemini-3.1-flash-image) for image generation.
"""

from __future__ import annotations

import asyncio
import io
import os

from dotenv import load_dotenv

load_dotenv()

if not os.environ.get("GEMINI_API_KEY"):
    raise ValueError("GEMINI_API_KEY is missing! Check your .env file.")

from google import genai
from google.genai import types as gtypes
from PIL import Image
from pydantic import BaseModel, Field
from pydantic_ai import Agent, BinaryContent

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

gemini_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class VisualPrompts(BaseModel):
    prompts: list[str] = Field(
        description="Exactly 5 distinct visual ad prompts for the product"
    )

# ---------------------------------------------------------------------------
# Pydantic AI agent — prompt generation
# Uses the same string shorthand format as your existing agents.
# BinaryContent is used to pass the product image inline alongside the text.
# ---------------------------------------------------------------------------

prompt_agent = Agent(
    "google:gemini-3-flash-preview",
    output_type=VisualPrompts,
    instructions=(
        "You are a world-class creative director specialising in product photography "
        "and advertising. Given a product image and a product description, produce "
        "exactly 5 distinct, highly evocative visual ad prompts to be fed into an AI "
        "image generator.\n\n"
        "Rules:\n"
        "- Each prompt must be 2–4 sentences, self-contained, and vivid.\n"
        "- Vary the mood across the 5 prompts: e.g. studio minimalist, cinematic "
        "lifestyle, dark editorial, abstract conceptual, outdoor golden-hour.\n"
        "- The product must always be the centrepiece, positioned at the centre of "
        "the frame — never off to the side or in the background.\n"
        "- Images are 1080×1920 (9:16 vertical) so describe portrait-friendly compositions.\n"
        "- NEVER mention text, typography, words, labels, logos, captions, taglines, "
        "overlays, or any written elements in any prompt. Pure visuals only.\n"
        "- Return ONLY the structured JSON — no extra commentary."
    ),
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resize_to_1080x1920(raw: bytes) -> bytes:
    """Resize any PIL-readable image to exactly 1080x1920 and return PNG bytes."""
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img = img.resize((1080, 1920), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------

async def generate_product_images(
    image_bytes: bytes,
    image_content_type: str,
    description: str,
) -> list[bytes]:
    """
    Full pipeline:
      1. Send the product image + description to gemini-3-flash-preview once
         and receive 5 structured visual prompts via Pydantic AI.
      2. Generate all 5 images concurrently with gemini-3.1-flash-image,
         passing the reference image each time for visual consistency.
      3. Resize each result to exactly 1080x1920 and return as PNG bytes.

    Args:
        image_bytes:        Raw bytes of the product reference image.
        image_content_type: MIME type, e.g. "image/jpeg".
        description:        Free-text product description.

    Returns:
        List of 5 PNG image byte strings.
    """

    # ------------------------------------------------------------------
    # Step 1 — Generate 5 visual prompts (image sent once)
    # BinaryContent lets Pydantic AI forward the raw image bytes as a
    # native multimodal part — same pattern as your existing emoji agent
    # but with an image attached alongside the text prompt.
    # ------------------------------------------------------------------
    result = await prompt_agent.run(
        [
            BinaryContent(data=image_bytes, media_type=image_content_type),
            (
                f"Product description: {description}\n\n"
                "Generate 5 creative visual ad prompts for this product."
            ),
        ]
    )

    prompts: list[str] = result.output.prompts[:5]

    # ------------------------------------------------------------------
    # Step 2 — Generate 5 images concurrently via google-genai SDK
    # Pydantic AI does not support image output, so we call the SDK
    # directly here. Each call gets the same reference image + its prompt.
    # The SDK is synchronous so we offload each call to the thread pool.
    # ------------------------------------------------------------------

    async def _generate_one(prompt: str) -> bytes:
        contents = [
            (
                f"{prompt}\n\n"
                f"Product context: {description}\n"
                "Keep the product appearance consistent with the reference image. "
                "Generate a stunning vertical 9:16 portrait advertisement. "
                "The product must be perfectly centred in the frame as the clear focal point. "
                "Do NOT include any text, words, letters, numbers, labels, captions, "
                "watermarks, logos, or typographic elements anywhere in the image. "
                "Pure photography or illustration only — no overlays of any kind."
            ),
            gtypes.Part.from_bytes(data=image_bytes, mime_type=image_content_type),
        ]

        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: gemini_client.models.generate_content(
                model="gemini-3.1-flash-image",
                contents=contents,
                config=gtypes.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=gtypes.ImageConfig(
                        aspect_ratio="9:16",
                        image_size="1K",
                    ),
                ),
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                return _resize_to_1080x1920(part.inline_data.data)

        raise RuntimeError("gemini-3.1-flash-image returned no image part")

    results: list[bytes] = await asyncio.gather(
        *[_generate_one(p) for p in prompts]
    )

    return results