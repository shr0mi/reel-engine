import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import TextToReelVideoExporter from "@/components/textToReelVideoExporter";

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
      <div className="p-6 text-center  min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500 mb-4 font-medium">No video or audio timeline configurations found.</p>
        <button
          onClick={() => navigate("/text-to-reel")}
          className="px-4 py-2 bg-neutral-900 text-white font-medium text-sm rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Go Back to Builder
        </button>
      </div>
    );
  }

  return (
    <>
      <TextToReelVideoExporter finalVideoState={finalVideoState} audioOutput={audioOutput} />
    </>
  );
}