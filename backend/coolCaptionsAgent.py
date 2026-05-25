import os
from typing import List
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from dotenv import load_dotenv

# 1. Load environment variables from .env file immediately
load_dotenv()

# Optional but recommended: Verify the key is loaded before initializing the model
if not os.environ.get("GEMINI_API_KEY"):
    raise ValueError("GEMINI_API_KEY is missing! Check your .env file.")

# Input schema matching your FastAPI server
class Segment(BaseModel):
    id: int
    start: float
    end: float
    text: str

# Schema for an individual emoji pop-up
class EmojiSegment(BaseModel):
    id: int = Field(description="The exact ID of the segment this emoji belongs to")
    start: float = Field(description="The start time of the segment")
    end: float = Field(description="The end time of the segment")
    emoji: str = Field(description="A highly relevant emoji for this segment")

# The final structured output model the AI will return
class EmojiResponse(BaseModel):
    emojis: list[EmojiSegment] = Field(description="List of selected segments that get emojis")


# System prompt instructs the agent to be selective (TikTok/Shorts style)
instructions = (
    "You are an expert short-form video editor (TikTok, YouTube Shorts, Reels). "
    "Your job is to analyze a video transcript and select choice moments to add pop-up emojis. "
    "\n\nCRITICAL RULES:\n"
    "1. DO NOT OVERDO IT. Too many emojis look spammy. Only select around 25% to 40% of the segments to receive emojis.\n"
    "2. Choose segments with high emotional impact, action verbs, or distinct visual nouns.\n"
    "3. Match the emojis perfectly to the context of the text."
)

# Define your Agent
agent = Agent(
    'google:gemini-2.5-flash',
    output_type=EmojiResponse,
    instructions=instructions
)

async def add_emojis_to_segments(segments: List[Segment]) -> EmojiResponse:
    """
    Takes a list of transcript segments, passes them to Pydantic AI,
    and returns a filtered list of segments paired with contextual emojis.
    """
    if not os.environ.get("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable is not set.")

    # Format the input segments into a clean text prompt for the LLM
    prompt = "Here are the video transcript segments. Select the best ones to add emojis to:\n\n"
    for seg in segments:
        prompt += f"ID: {seg.id} | [{seg.start}s -> {seg.end}s]: {seg.text}\n"

    # Use async agent.run since your FastAPI endpoint is async
    result = await agent.run(prompt)
    
    return result.output