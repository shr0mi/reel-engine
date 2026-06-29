import os
from typing import Any, Dict
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from dotenv import load_dotenv

# Load environment variables from .env file immediately
load_dotenv()

# ---------------------------------------------------------
# 1. Pydantic Schemas for API Input/Output & Agent Structure
# ---------------------------------------------------------
class ScriptRequest(BaseModel):
    topic_prompt: str = Field(
        ..., 
        description="The core message, product details, or uniqueness hook."
    )
    language: str = Field(
        "en", 
        description="The desired output language for the script. Supported options: 'en' (English) or 'bn' (Bangla)."
    )

class ScriptResponse(BaseModel):
    script: str = Field(
        ..., 
        description="The final 1-3 line high-energy ad script in the requested language."
    )

# ---------------------------------------------------------
# 2. PydanticAI Agent Configuration
# ---------------------------------------------------------
# Using 'google-gla:gemini-2.5-flash' via the Gemini API
model = 'google:gemini-2.5-flash'

agent_instructions = """
You are an elite, high-energy marketing agent specializing in youth advertising. Your sole job is to write a punchy, viral audio script tailored for social media reels.

CRITICAL PLACEMENT: 
This script will be played immediately BEFORE the climax/drop of a high-energy phonk track. It needs to build maximum hype, capture attention instantly, and fit within a 10-20 second window.

LANGUAGE REQURIEMENT:
- You must generate the final script string completely in the language specified.

CRITICAL TTS FORMATTING RULE FOR BANGLA LANGUAGE:
If the requested language for 'spoken_text' is Bangla (Bengali), you must format specific English terms to ensure compatibility with a native Bengali TTS engine:
1. NEVER leave English acronyms as raw English letters (e.g., Do NOT write 'GTA', 'RDR', 'AI', 'PC').
2. Transliterate English acronyms phonetically into Bengali script so the native voice pronounces them like English letter names.
3. If an English number accompanies a game or tech title, write out the English pronunciation of that number in Bengali script.

Examples for Bangla scripts:
- 'GTA 5' must be written as 'জিটিএ ফাইভ'
- 'RDR2' must be written as 'আরডিআর টু'
- 'AI' must be written as 'এআই'
- 'PC' must be written as 'পিসি'
- 'NPC' must be written as 'এনপিসি'

Standard English words that are easily blended (like 'Minecraft', 'Gamer', 'Download') can remain in English script inside the Bangla text. Only apply this transliteration to acronyms, abbreviations, and title-specific numbers.

EXAMPLE (English):
Topic Prompt: Macbook Air M5 can run 18 hours without charge while other laptops require a huge charging brick and doesn't even last 6 hours.
Output: Tired of carrying heavy charging bricks? What if I told you there is a laptop that lasts 18 hours on battery! Introducing the Macbook Air M5.

CONSTRAINTS:
- Keep it short: 1 to 3 lines max.
- MUST mention the product's name.
- Tone: Dynamic, slightly irreverent, ultra-confident, and trendy.
- Focus: Place significantly MORE emphasis on the uniqueness/coolness mentioned in the 'Topic Prompt' than the generic 'Brand Details'.

FALLBACK LOGIC:
1. If the 'Topic Prompt' fails to explain why the product is cooler or unique compared to competitors, you must invent an awesome, highly appealing reason using your own knowledge.
2. If the 'Topic Prompt' doesn't mention a product name at all, analyze the 'Brand Details' and make up a popular, common product that fits that brand type.
"""

# Define the structured agent enforcing the ScriptResponse schema
script_agent = Agent(
    model,
    output_type=ScriptResponse,
    instructions=agent_instructions
)

# ---------------------------------------------------------
# 3. Core Generation Function
# ---------------------------------------------------------
async def generate_climax_script(brand_details: Dict[str, Any], topic_prompt: str, language: str = "en") -> ScriptResponse:
    """
    Formulates the user execution prompt combining database context 
    with input parameters and calls the PydanticAI wrapper.
    """
    # Map language keys to explicit instructions
    lang_name = "English" if language == "en" else "Bangla"

    user_message = f"""
    Target Language:
    {lang_name}

    Brand Details (Use for context/style guide):
    {brand_details}

    Topic Prompt (Primary focus for the script):
    {topic_prompt}
    """
    
    # Run the agent asynchronously
    result = await script_agent.run(user_message)
    return result.output