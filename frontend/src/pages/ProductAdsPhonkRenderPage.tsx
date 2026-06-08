import React from "react";
import { useLocation, useNavigate } from "react-router";
import ProductAdsPhonkExportPage from "@/components/ProductAdsPhonkExportPage";

// --- State Interfaces ---
interface PhonkAudioData {
  id: number;
  audio_url: string;
  climax_point: number | string;
}

interface CaptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface AudioGenData {
  tts_audio_url: string;
  tts_audio_duration: number;
  caption: CaptionSegment[];
}

interface UploadedImagesData {
  image1_url: string;
  image2_url: string;
  image3_url: string;
  image4_url: string;
  image5_url: string;
}

export default function ProductAdsPhonkRenderPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract router state payloads
  const { audioData, audioGenData, uploadedImages } = (location.state || {}) as {
    audioData?: PhonkAudioData;
    audioGenData?: AudioGenData;
    uploadedImages?: UploadedImagesData;
  };

  // Fallback UI validation guard if states are empty or direct page access occurs
  if (!audioData || !audioGenData || !uploadedImages) {
    return (
      <main className="pt-16 min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm">
          <p className="text-red-500 font-medium mb-4">
            Required generation configurations or assets are missing.
          </p>
          <button
            onClick={() => navigate(-1)} // Takes user back to configuration step
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Go Back & Regenerate
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen bg-white">
      <ProductAdsPhonkExportPage 
        audioData={audioData}
        audioGenData={audioGenData}
        uploadedImages={uploadedImages}
      />
    </main>
  );
}