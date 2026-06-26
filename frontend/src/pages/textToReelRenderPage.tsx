import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import TextToReelVideoExporter from "@/components/textToReelVideoExporter";
import Navbar from "@/components/Navbar";

// ==========================================
// TypeScript Interfaces
// ==========================================
interface AudioStoryBlock {
  paragraph_id: number;
  start: number;
  end: number;
  visual_prompt: string[];
}

interface Caption {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface AudioOutput {
  tone: string;
  story_blocks: AudioStoryBlock[];
  captions: Caption[];
  audio_url: string;
  success: boolean;
}

interface FinalVideoItem {
  duration: number;
  stretch: number;
  url: string;
  download_link: string;
  width: number;
  height: number;
}

interface FinalVideoStateItem {
  paragraph_id: number;
  start: number;
  end: number;
  videos: FinalVideoItem[];
}

type FinalVideoState = FinalVideoStateItem[];

export default function TextToReelRender() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const { finalVideoState, audioOutput } = state as {
    finalVideoState: FinalVideoState | undefined;
    audioOutput: AudioOutput | undefined;
  };

  // Safe validation check ensuring assets exist before processing
  if (!finalVideoState || !audioOutput) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-24 px-6 text-center">
          <div className="bg-card text-card-foreground border border-border p-8 rounded-xl shadow-md max-w-md w-full">
            <p className="text-destructive font-medium mb-6">
              No video or audio timeline configurations found.
            </p>
            <button
              onClick={() => navigate("/text-to-reel")}
              className="w-full px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition duration-200"
            >
              Go Back to Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <TextToReelVideoExporter finalVideoState={finalVideoState} audioOutput={audioOutput} />
    </div>
  );
}