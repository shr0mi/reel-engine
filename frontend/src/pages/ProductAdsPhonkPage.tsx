import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';


// Interfaces for the program
interface PhonkAudioResponse {
  id: number;
  audio_url: string;
  climax_point: number | string;
}

interface ScriptResponse {
  script: string;
}

interface CaptionItem {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface AudioGenResponse {
  tts_audio_url: string;
  tts_audio_duration: number;
  caption: CaptionItem[];
}

interface UploadedImagesResponse {
  image1_url: string;
  image2_url: string;
  image3_url: string;
  image4_url: string;
  image5_url: string;
}

export default function ProductAdsPhonkPage() {
  const navigate = useNavigate();

  // Section 1 State (Audio Fetching)
  const [selectedAudio, setSelectedAudio] = useState<string>('1');
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<PhonkAudioResponse | null>(null);
  const [showPromptSection, setShowPromptSection] = useState<boolean>(false);
  
  // Section 2 State (Script Generation)
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const [language, setLanguage] = useState<string>('en');
  const [isScriptLoading, setIsScriptLoading] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [showScriptSection, setShowScriptSection] = useState<boolean>(false);

  // Section 3 State (Script Editing)
  const [scriptState, setScriptState] = useState<string>('');

  // Section 3 to 4 State (Audio Generation)
  const [isAudioGenLoading, setIsAudioGenLoading] = useState<boolean>(false);
  const [audioGenError, setAudioGenError] = useState<string | null>(null);
  const [audioGenData, setAudioGenData] = useState<AudioGenResponse | null>(null);
  const [showFinalAudioSection, setShowFinalAudioSection] = useState<boolean>(false);

  // Section 4 Image Upload States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImagesResponse | null>(null);
  const [useAiImages, setUseAiImages] = useState<boolean>(false);

  // Section 5 AI Image Generation States
  const [showAiImageSection, setShowAiImageSection] = useState<boolean>(false);
  const [aiProductImage, setAiProductImage] = useState<File | null>(null);
  const [aiProductDescription, setAiProductDescription] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);

  // Handler for Card 1 (GET Request)
  const handleFetchAudio = async () => {
    setIsAudioLoading(true);
    setAudioError(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/product-ads/get-phonk-audio?id=${selectedAudio}`);
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data: PhonkAudioResponse = await response.json();
      setAudioData(data);
      setShowPromptSection(true);
    } catch (err: any) {
      setAudioError(err.message || 'Failed to fetch the audio template.');
      setShowPromptSection(false);
      setShowScriptSection(false);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    setIsScriptLoading(true);
    setScriptError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/product-ads/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic_prompt: topicPrompt,
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}. Failed to generate script.`);
      }

      const data: ScriptResponse = await response.json();
      setScriptState(data.script);
      setShowScriptSection(true);
    } catch (err: any) {
      setScriptError(err.message || 'An error occurred while receiving the script.');
      setShowScriptSection(false);
    } finally {
      setIsScriptLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    setIsAudioGenLoading(true);
    setAudioGenError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/product-ads/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptState,
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}. Failed to generate audio.`);
      }

      const data: AudioGenResponse = await response.json();
      setAudioGenData(data);
      setShowFinalAudioSection(true);
    } catch (err: any) {
      setAudioGenError(err.message || 'An error occurred while generating speech audio.');
      setShowFinalAudioSection(false);
    } finally {
      setIsAudioGenLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const filesArray = Array.from(e.target.files);
    
    if (filesArray.length > 5) {
      setUploadError("You can upload a maximum of 5 images.");
      setSelectedFiles([]);
      return;
    }
    
    setUploadError(null);
    setSelectedFiles(filesArray);
  };

  const handleGenerateAdvertisement = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Please upload at least one image before generating the advertisement.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/product-ads/api/upload-ads-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}. Upload failed.`);
      }

      const data: UploadedImagesResponse = await response.json();
      setUploadedImages(data);

      navigate('/product-ads/phonk-style/render', {
        state: {
          audioData: audioData,
          audioGenData: audioGenData,
          uploadedImages: data
        }
      });

    } catch (err: any) {
      setUploadError(err.message || 'An error occurred while uploading the advertisement images.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseAiImages = () => {
    setUseAiImages(true);
    setShowAiImageSection(true);
  };

  const handleAiProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setAiProductImage(e.target.files[0]);
    setAiGenerateError(null);
  };

  const handleAiGenerateAdvertisement = async () => {
    if (!aiProductImage) {
      setAiGenerateError("Please upload a product reference image.");
      return;
    }
    if (!aiProductDescription.trim()) {
      setAiGenerateError("Please provide a product description.");
      return;
    }

    setIsAiGenerating(true);
    setAiGenerateError(null);

    const formData = new FormData();
    formData.append("image", aiProductImage);
    formData.append("description", aiProductDescription.trim());

    try {
      const response = await fetch('http://127.0.0.1:8000/api/product-ads/api/generate-product-ads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}. AI image generation failed.`);
      }

      const data: UploadedImagesResponse = await response.json();
      setUploadedImages(data);

      navigate('/product-ads/phonk-style/render', {
        state: {
          audioData: audioData,
          audioGenData: audioGenData,
          uploadedImages: data
        }
      });

    } catch (err: any) {
      setAiGenerateError(err.message || 'An error occurred while generating AI advertisement images.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-100">
      
      {/* 1. FIXED TOPBAR */}
      <Navbar/>

      <main className="pt-16 min-h-screen bg-white flex flex-col items-center px-4 py-12 space-y-8">
        {/* Page Heading */}
        <h1 className="text-3xl font-black text-black tracking-tight mb-4">
          Phonk Style Ad Generator
        </h1>

        {/* Card 1: Configuration Selection */}
        <div className="w-full max-w-xl bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label htmlFor="audio-select" className="block text-sm font-semibold text-black mb-2">
              Select Phonk Audio
            </label>
            <select
              id="audio-select"
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
              className="w-full bg-white border border-gray-300 text-black py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-black cursor-pointer text-sm"
            >
              <option value="1">Montagem Alquimia</option>
            </select>
          </div>

          {audioError && (
            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm font-medium">
              {audioError}
            </div>
          )}

          <button
            onClick={handleFetchAudio}
            disabled={isAudioLoading}
            className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:bg-neutral-400"
          >
            {isAudioLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Template...
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>

        {/* Card 2: Generated Results & Prompt Input */}
        <div 
          className={`w-full max-w-xl transition-all duration-500 ease-in-out transform ${
            showPromptSection 
              ? 'opacity-100 translate-y-0 max-h-[600px]' 
              : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            {audioData?.audio_url && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black">
                  Preview Template Audio
                </label>
                <audio src={audioData.audio_url} controls className="w-full rounded-xl bg-white" />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="prompt-input" className="block text-sm font-semibold text-black">
                Topic Prompt Input
              </label>
              <textarea
                id="prompt-input"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                placeholder="What makes your product unique or cooler than other similar products"
                rows={4}
                className="w-full bg-white border border-gray-300 text-black py-3 px-4 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="language-select" className="block text-sm font-semibold text-black">
                Select Language
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white border border-gray-300 text-black py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-black cursor-pointer text-sm"
              >
                <option value="en">English</option>
                <option value="bn">Bangla</option>
              </select>
            </div>

            {scriptError && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm font-medium">
                {scriptError}
              </div>
            )}

            <button
              onClick={handleGenerateScript}
              disabled={isScriptLoading}
              className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:bg-neutral-400"
            >
              {isScriptLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>

        {/* Card 3: Script Section */}
        <div 
          className={`w-full max-w-xl transition-all duration-500 ease-in-out transform ${
            showScriptSection 
              ? 'opacity-100 translate-y-0 max-h-[600px]' 
              : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <label htmlFor="script-box" className="block text-sm font-semibold text-black">
                Generated Script
              </label>
              <textarea
                id="script-box"
                value={scriptState}
                onChange={(e) => setScriptState(e.target.value)}
                rows={6}
                className="w-full bg-white border border-gray-300 text-black py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm resize-y"
              />
            </div>

            {audioGenError && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm font-medium">
                {audioGenError}
              </div>
            )}

            <button
              onClick={handleGenerateAudio}
              disabled={isAudioGenLoading}
              className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:bg-neutral-400"
            >
              {isAudioGenLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Audio...
                </>
              ) : (
                'Generate Audio'
              )}
            </button>
          </div>
        </div>

        {/* Card 4: Final Audio & Image Upload Section */}
        <div 
          className={`w-full max-w-xl transition-all duration-500 ease-in-out transform ${
            showFinalAudioSection 
              ? 'opacity-100 translate-y-0 max-h-[800px]' 
              : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            {audioGenData?.tts_audio_url && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black">
                  Generated Speech Audio
                </label>
                <audio src={audioGenData.tts_audio_url} controls className="w-full rounded-xl bg-white" />
              </div>
            )}

            {/* File Upload Field */}
            <div className="space-y-2">
              <label htmlFor="image-upload" className="block text-sm font-semibold text-black">
                Upload Advertisement Images (Max 5)
              </label>
              <input
                id="image-upload"
                type="file"
                multiple
                accept=".png, .jpg, .jpeg"
                onChange={handleFileChange}
                disabled={useAiImages}
                className="w-full bg-white border border-gray-300 text-black py-2 px-3 rounded-xl file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-neutral-800 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {selectedFiles.length > 0 && !useAiImages && (
                <p className="text-xs text-neutral-500 mt-1">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'} selected.
                </p>
              )}
            </div>

            {uploadError && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm font-medium">
                {uploadError}
              </div>
            )}

            <button
              onClick={handleGenerateAdvertisement}
              disabled={isUploading || useAiImages}
              className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Images...
                </>
              ) : (
                'Generate Advertisement'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* AI Image Generation Button */}
            <button
              onClick={handleUseAiImages}
              disabled={useAiImages}
              className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-xl flex items-center justify-center border border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Images using AI
            </button>
          </div>
        </div>

        {/* Card 5: AI Image Generation Section */}
        <div
          className={`w-full max-w-xl transition-all duration-500 ease-in-out transform ${
            showAiImageSection
              ? 'opacity-100 translate-y-0 max-h-[700px]'
              : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-black">AI Image Generation</h2>
              <p className="text-xs text-gray-400 mt-1">
                Upload a product reference image and describe it — we'll generate 5 ad-ready visuals for you.
              </p>
            </div>

            {/* Product Image Upload */}
            <div className="space-y-2">
              <label htmlFor="ai-product-image" className="block text-sm font-semibold text-black">
                Product Reference Image
              </label>
              <input
                id="ai-product-image"
                type="file"
                accept=".png, .jpg, .jpeg, .webp"
                onChange={handleAiProductImageChange}
                className="w-full bg-white border border-gray-300 text-black py-2 px-3 rounded-xl file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-neutral-800 text-sm"
              />
              {aiProductImage && (
                <p className="text-xs text-neutral-500 mt-1">
                  {aiProductImage.name}
                </p>
              )}
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <label htmlFor="ai-product-description" className="block text-sm font-semibold text-black">
                Product Description
              </label>
              <textarea
                id="ai-product-description"
                value={aiProductDescription}
                onChange={(e) => setAiProductDescription(e.target.value)}
                placeholder="Describe your product — its look, feel, use case, and any visual style you want for the ads"
                rows={4}
                className="w-full bg-white border border-gray-300 text-black py-3 px-4 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
              />
            </div>

            {aiGenerateError && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm font-medium">
                {aiGenerateError}
              </div>
            )}

            <button
              onClick={handleAiGenerateAdvertisement}
              disabled={isAiGenerating}
              className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:bg-neutral-400"
            >
              {isAiGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating AI Images...
                </>
              ) : (
                'Generate Advertisement'
              )}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}