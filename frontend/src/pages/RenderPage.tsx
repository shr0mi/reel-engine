// RenderPage.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import VideoExportPage from "@/components/VideoExporter";
import Navbar from "@/components/Navbar";

interface CaptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface GlobalStyles {
  fontFamily: string;
  fontSize: number;
  primaryColor: string;
  strokeColor: string;
  strokeWidth: number;
  positionY: number;
}

interface CaptionPayload {
  videoUrl: string;
  globalStyles: GlobalStyles;
  segments: CaptionSegment[];
}

export default function RenderPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const {captionData, emojiData, bRollData} = state;

  useEffect(() => {
    console.log(captionData?.globalStyles.fontFamily);
  }, [])

  if (!captionData) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-24 px-6 text-center">
          <div className="bg-card text-card-foreground border border-border p-8 rounded-xl shadow-md max-w-md w-full">
            <p className="text-destructive font-medium mb-6">No caption configurations found.</p>
            <button
              onClick={() => navigate("/cool-captions/transcribe")}
              className="w-full px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:bg-primary/90 transition duration-200"
            >
              Upload Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  // useEffect(() => {
  //   console.log(captionData);
  // }, [captionData]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <VideoExportPage captionData={captionData} emojiData={emojiData} bRollData={bRollData} />
    </div>
  );
}