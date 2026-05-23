// RenderPage.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import VideoExportPage from "@/components/VideoExporter";

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

  const captionData = location.state as CaptionPayload | null;

  if (!captionData) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">No caption configurations found.</p>
        <button
          onClick={() => navigate("/transcribe")}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Upload Video
        </button>
      </div>
    );
  }

  // useEffect(() => {
  //   console.log(captionData);
  // }, [captionData]);

  return (
    <>
      <VideoExportPage captionData={captionData} />
    </>
  );
}