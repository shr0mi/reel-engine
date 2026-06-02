import os
from pydantic_ai import Agent
from typing import List, Literal
from pydantic import BaseModel, Field

# Define the allowed tones (6 total)
ToneType = Literal["inspirational", "emotional", "peaceful", "funny", "educational", "energetic"]

class StoryBlock(BaseModel):
    paragraph: int = Field(description="Serial number tracking the sequence (1, 2, 3, ...)")
    spoken_text: str = Field(description="The voiceover or spoken script text. Must be entirely in the requested language.")
    visual_prompt: List[str] = Field(description="A list of specific visual visual scene descriptions or B-roll ideas that match this paragraph.")

class ScriptResponse(BaseModel):
    tone: ToneType = Field(description="The overall emotional or strategic tone chosen for the reel.")
    story_blocks: List[StoryBlock] = Field(description="The chronological chronological breakdown of the script scenes.")

# Initialize your preferred model (e.g., OpenAI, Gemini, or a local model via Ollama)
# Make sure your API keys (like OPENAI_API_KEY) are set in your environment variables.
agent = Agent(
    'google:gemini-2.5-flash',
    output_type=ScriptResponse,
    instructions=(
        "You are an elite viral short-form video scriptwriter specializing in Reels, TikToks, and YouTube Shorts. "
        "Your goal is to write a high-retaining, engaging script tailored to the brand's profile and the specified tone. "
        "Strictly adhere to the user's requested language and pacing constraints."
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