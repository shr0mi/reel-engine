from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic import BaseModel, Field

# load environment variables
load_dotenv()

# Desired output structure
class BrandAnalysis(BaseModel):
    brand_name: str = Field(
        description="The name of the brand. If not explicitly mentioned in the prompt, invent a creative and relevant brand name."
    )
    what_brand_does: str = Field(
        description="What the brand sells, their location, and any other crucial details found in the prompt."
    )
    who_are_customers: str = Field(
        description="Target audience, their generation (e.g., Gen Alpha, Gen Z, Millennials, Boomers), and estimated gender demographics. Inference allowed if not directly stated."
    )
    what_customers_like: str = Field(
        description="Types of video/reels content this audience engages with. Provide concrete content angles (e.g., budget humor, nostalgia, aesthetic product showcases) tailored to their niche."
    )

# Define your Agent
agent = Agent(
    'google:gemini-2.5-flash',
    output_type=BrandAnalysis,
    instructions=(
        "You are an expert brand strategist and social media content creator. "
        "Your job is to analyze raw brand prompts and extract deep insights tailored for short-form video content (Instagram Reels/TikTok). "
        "Always fill out every field. If information is missing, use your marketing expertise to logically infer and extrapolate realistic details."
    )
)

async def analyze_brand_prompt(prompt: str) -> BrandAnalysis:
    """
    Takes a raw brand prompt, runs it through the PydanticAI agent,
    and returns a structured BrandAnalysis object.
    """
    result = await agent.run(prompt)
    return result.output