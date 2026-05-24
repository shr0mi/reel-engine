import os
from pydantic import BaseModel, Field
from pydantic_ai import Agent

# 1. Keep your exact schema model
class CharacterSheet(BaseModel):
    name: str = Field(description="The hero's name")
    role: str = Field(description="Their character class, e.g., Mage, Warrior, Rogue")
    level: int = Field(description="Starting level, usually 1")
    abilities: list[str] = Field(description="A list of 3 starting abilities or skills")
    backstory: str = Field(description="A brief, 2-sentence background story")

# 2. Assign the schema globally via output_type in the Agent definition
agent = Agent(
    'google:gemini-2.5-flash',
    output_type=CharacterSheet,  # <- Changed from result_type to output_type
    instructions="You are an expert RPG game master. Create unique, thematic character profiles."
)

def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("❌ Error: GEMINI_API_KEY environment variable is not set.")
        return

    print("Asking Gemini to generate a structured character...")
    
    # 3. Simple run call without competing dynamic parameters
    result = agent.run_sync("Give me a gritty, dark-fantasy monster hunter character.")
    
    # 4. Extract your fully typed data object
    character: CharacterSheet = result.output
    
    print("\n--- Generated Character Profile ---")
    print(f"Name: {character.name}")
    print(f"Class: {character.role} (Level {character.level})")
    print(f"Abilities: {', '.join(character.abilities)}")
    print(f"Backstory: {character.backstory}")

if __name__ == "__main__":
    main()