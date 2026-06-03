import os
from pydantic_ai import Agent
from typing import List, Literal
from pydantic import BaseModel, Field

# Define the allowed tones (6 total)
ToneType = Literal["inspirational", "emotional", "peaceful", "funny", "educational", "energetic"]

class StoryBlock(BaseModel):
    paragraph: int = Field(description="Serial number tracking the sequence (1, 2, 3, ...)")
    spoken_text: str = Field(description="The voiceover or spoken script text. Must be entirely in the requested language.")
    visual_prompt: List[str] = Field(description=(
        "A sequence of 2-4 simple, highly generic English search queries for the Pexels API. "
        "CRITICAL: Use ONLY basic, high-level nouns or standard category terms (e.g., 'frustrated gamer', 'computer games', 'dhaka city'). "
        "NEVER combine multiple actions or abstract concepts into a single query (e.g., Do NOT write 'struggling computer graphics' or 'gamer looking at old pc'). "
        "Keep each query to 1-3 words max."
    ))

class ScriptResponse(BaseModel):
    tone: ToneType = Field(description="The overall emotional or strategic tone chosen for the reel.")
    story_blocks: List[StoryBlock] = Field(description="The chronological chronological breakdown of the script scenes.")

# Initialize your preferred model
agent = Agent(
    'google:gemini-2.5-flash',
    output_type=ScriptResponse,
    instructions=(
        "You are an elite viral short-form video scriptwriter specializing in Reels, TikToks, and YouTube Shorts. "
        "Your goal is to write a high-retaining, engaging script tailored to the brand's profile and the specified tone. "
        "Strictly adhere to the user's requested language(only in spoken_text) and pacing constraints.\n\n"

        "CRITICAL VISUAL PROMPT CONSTRAINT:\n"
        "The 'visual_prompt' list must contain ONLY generic, broad search terms suitable for a stock video API (like Pexels).\n"
        "- DO NOT create complex, descriptive, or hyper-specific phrases.\n"
        "- DO NOT mix abstract concepts together (e.g., avoid 'struggling computer graphics').\n"
        "- DO use simple, atomic keywords representing a single clean subject or location.\n\n"
        "Examples of BAD vs. GOOD queries:\n"
        "  * BAD: 'frustrated gamer old PC' -> GOOD: 'frustrated gamer'\n"
        "  * BAD: 'struggling computer graphics' -> GOOD: 'computer games'\n"
        "  * BAD: 'Dhaka city street view' -> GOOD: 'Dhaka city'\n\n"

        "CRITICAL TTS FORMATTING RULE FOR BANGLA LANGUAGE:\n"
        "If the requested language for 'spoken_text' is Bangla (Bengali), you must format specific English terms to ensure compatibility with a native Bengali TTS engine:\n"
        "1. NEVER leave English acronyms as raw English letters (e.g., Do NOT write 'GTA', 'RDR', 'AI', 'PC').\n"
        "2. Transliterate English acronyms phonetically into Bengali script so the native voice pronounces them like English letter names.\n"
        "3. If an English number accompanies a game or tech title, write out the English pronunciation of that number in Bengali script.\n\n"
        
        "Examples for Bangla scripts:\n"
        "- 'GTA 5' must be written as 'জিটিএ ফাইভ'\n"
        "- 'RDR2' must be written as 'আরডিআর টু'\n"
        "- 'AI' must be written as 'এআই'\n"
        "- 'PC' must be written as 'পিসি'\n"
        "- 'NPC' must be written as 'এনপিসি'\n\n"
        "Standard English words that are easily blended (like 'Minecraft', 'Gamer', 'Download') can remain in English script inside the Bangla text. Only apply this transliteration to acronyms, abbreviations, and title-specific numbers."
    )
)

async def generate_reel_script(
    brand_details: dict, 
    topic_prompt: str, 
    language: str, 
    duration: int
) -> ScriptResponse:
    """
    Formulates the prompt, handles empty/random topic logic, and runs the PydanticAI agent.
    """
    # Map language keys to explicit instructions
    lang_name = "English" if language == "en" else "Bangla"
    
    # Handle random topic generation
    topic_clause = (
        f"Topic: {topic_prompt}" if topic_prompt.strip() 
        else "Topic: Generate a highly creative, hyper-engaging random topic that perfectly appeals to what the target customers like."
    )

    # Build a clean instruction block for the agent
    prompt = f"""
    Create a video script based on these parameters:

    {topic_clause}
    Target Language: {lang_name} (The 'spoken_text' MUST be written entirely in this language)
    Target Duration: {duration} seconds (Ensure the total word count matches normal reading speed for this duration)

    --- BRAND DETAILS ---
    Brand Name: {brand_details.get('brand_name')}
    What they do: {brand_details.get('what_brand_does')}
    Target Audience: {brand_details.get('who_are_customers')}
    What the audience loves: {brand_details.get('what_customers_like')}
    
    Make the script organic, natural, and highly tailored to their target demographic's preferences.
    """

    # Run the agent asynchronously
    result = await agent.run(prompt)
    return result.output