# AutoReelEngine
## Summary
AutoReelEngine is an AI content tool for startups and businesses that automatically creates engaging social media videos, product ads, and meme-style posts from text, images, or raw footage. It helps brands post more often, save time, and keep their online presence active without needing a full creative team.
## Main Features
The platform will support four content modes:
- **CoolCaptions:** takes a talking-head video and automatically generates captions, visual highlights, icons, cutaway suggestions, and emphasis points to make the video more engaging.
- **Text2Reel:** converts a text post, article, or script into a short reel by generating scene-by-scene visual direction, captions, and optional voiceover.
- **ProductAds:** uses uploaded product images or videos to generate high-conversion promotional reels with motion graphics, transitions, and brand-aligned messaging.
- **Mister_Memer:** creates brand-safe meme content tailored to the audience’s tone and engagement style to support frequent, low-effort posting.
## Architecture
![Architecture Flowchart](autoreelengine-graph.svg)

## Demo
**CoolCaptions:**
- Uses OpenAI whishper to transcribe the video and generate srt file
- Uses Remotion to add captions with appropiate animations
- Gives user the ability to change position, font, font-size
- Adds relevant emoji using an agent created with PydanticAI library and gemini

https://github.com/user-attachments/assets/74cc4df7-0e45-4d66-8e7e-91ebe94d95f0

**Text2Reel**
- Uses PydanticAI and Gemini API to generate script, tone, visual prompts
- Uses Brand Consistency Agent to find all necessary details about the brand
- Supports two languages: Bangla and English
- Uses EdgeTTS to generate to generate the audio file
- Gives user the ability to edit script, visual prompts
- Fetches Videos from Pexels API based on the visual prompts
- Automatically selects background music based on tone

| Example Output(English) | Example Output(Bangla) |
| :--- | :--- |
|<video src="https://github.com/user-attachments/assets/d7e4c00c-f3c3-4b4c-8bd2-a70bbd2eb7e0" width="100%" controls></video> |<video src="https://github.com/user-attachments/assets/c452c010-79bf-43d0-943d-75065c1e6bdc" width="100%" controls></video> |



**Mister_Memer:**
- Uses custom curated list of meme templates
- Uses meme template description to find appropiate template
- Uses Brand Consistency Agent to let the LLM know the context
- Capable of creating both random and topic targeted memes 

![Mister Memer Showcase](images/mister_memer_img1.png)
![Mister Memer Showcase](images/mister_memer_img2.png)







