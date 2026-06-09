import os
from typing import List
from pydantic import BaseModel, Field, model_validator
from pydantic_ai import Agent
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

if not os.environ.get("GEMINI_API_KEY"):
    raise ValueError("GEMINI_API_KEY is missing! Check your .env file.")

# Input schema matching your transcript segments
class Segment(BaseModel):
    id: int
    start: float
    end: float
    text: str

# Schema for an individual B-Roll placement
class BRollItem(BaseModel):
    b_roll_id: int = Field(description="Sequential ID starting from 1")
    query: str = Field(
        description="A short, simple, and generic search query for the Pexels API (e.g., 'man laptop', 'city traffic', 'person thinking'). Avoid specific or complex phrases."
    )
    start: float = Field(description="The exact timestamp in seconds when this B-roll should start, based on when the topic is spoken.")
    end: float = Field(description="The timestamp when the B-roll ends. This will be automatically forced to start + 5s.")

    @model_validator(mode='after')
    def enforce_five_second_duration(self) -> 'BRollItem':
        """
        Programmatically guarantees that the B-roll is always exactly 5 seconds long,
        overriding any minor arithmetic errors the LLM might make.
        """
        self.end = round(self.start + 5.0, 2)
        return self

# The final structured output model containing the list of B-rolls
class BRollResponse(BaseModel):
    b_rolls: list[BRollItem] = Field(description="List of scheduled B-roll placements spaced out across the video.")


# System instructions tailored for pacing and Pexels API optimization
instructions = (
    "You are an expert short-form video editor. Your task is to analyze a video transcript "
    "and suggest relevant visual B-roll sequences using the Pexels API.\n\n"
    "CRITICAL RULES:\n"
    "1. PACING (FREQUENCY): B-rolls should not overlap and should feel intentional. Aim for a frequency "
    "of roughly once every 20 seconds. Do not crowd the video with back-to-back B-rolls.\n"
    "2. PEXELS OPTIMIZED QUERIES: The search queries MUST be simple, generic, and descriptive (1 to 3 words max). "
    "Pexels struggles with highly specific queries. For example, instead of 'entrepreneur stressed about quarterly taxes', "
    "use 'stressed man laptop' or 'frustrated businessman'.\n"
    "3. TIMING ACCURACY: Pinpoint the `start` time exactly to the segment where the concept is first introduced "
    "so the visual aligns perfectly with the speech."
)

# Define your Pydantic AI Agent
agent = Agent(
    'google:gemini-2.5-flash',
    output_type=BRollResponse,
    instructions=instructions
)

async def generate_b_roll_suggestions(segments: List[Segment]) -> BRollResponse:
    """
    Takes a list of transcript segments, analyzes the content and timeline,
    and returns an optimized list of spaced-out B-roll suggestions for Pexels.
    """
    if not os.environ.get("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable is not set.")

    if not segments:
        return BRollResponse(b_rolls=[])

    # Format the timeline clearly so the AI understands the total duration and spacing
    prompt = (
        "Here is the video transcript with timestamps. Review the entire timeline and select "
        "the best hooks/moments to insert a B-roll roughly every 20 seconds:\n\n"
    )
    for seg in segments:
        prompt += f"ID: {seg.id} | [{seg.start}s -> {seg.end}s]: {seg.text}\n"

    # Execute the asynchronous agent run
    result = await agent.run(prompt)
    
    return result.output