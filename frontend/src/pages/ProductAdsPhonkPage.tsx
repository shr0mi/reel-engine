import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { 
  Menu, 
  X, 
  Captions, 
  Film, 
  Megaphone, 
  Laugh, 
  Loader2,
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  points: string[];
  icon: React.ComponentType<{ className?: string }>;
}

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features: Feature[] = [
    {
      id: 'cool-captions',
      name: 'CoolCaptions',
      slug: '/cool-captions/transcribe',
      description: 'Transform talking-head videos into high-engagement content automatically.',
      points: [
        'Automated accurate caption generation',
        'Smart visual highlights and dynamic emphasis points',
        'Contextual cutaway and icon suggestions'
      ],
      icon: Captions,
    },
    {
      id: 'text-2-reel',
      name: 'Text2Reel',
      slug: '/text-to-reel',
      description: 'Convert scripts, articles, or text posts into ready-to-publish short reels.',
      points: [
        'Scene-by-scene visual direction AI generation',
        'Automated matching text captions',
        'Optional natural AI voiceover integration'
      ],
      icon: Film,
    },
    {
      id: 'product-ads',
      name: 'ProductAds',
      slug: '/product-ads',
      description: 'Turn static product media into high-conversion promotional assets.',
      points: [
        'Instant motion graphics and smooth transitions',
        'Brand-aligned messaging and targeted CTAs',
        'Optimized for social commerce algorithms'
      ],
      icon: Megaphone,
    },
    {
      id: 'mister-memer',
      name: 'Mister_Memer',
      slug: '/mister-memer/generate',
      description: 'Keep your feed active with brand-safe, hyper-relevant meme content.',
      points: [
        'Audience tone and engagement style matching',
        'Low-effort, high-frequency posting schedules',
        'Culturally relevant, brand-protected generation'
      ],
      icon: Laugh,
    },
  ];

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
      setShowScriptSection(false); // Cascade close subsequent steps on parent error
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
          language: language // <-- Add this line to pass the language param
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
          language: language // Reuses the language state from Card 2
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
    formData.append("files", file); // Adjust the key string ("files") if your backend expects a specific field name
  });

  try {
    const response = await fetch('http://127.0.0.1:8000/api/product-ads/api/upload-ads-images', {
      method: 'POST',
      body: formData, 
      // Note: Do NOT manually set the 'Content-Type' header here. 
      // The browser automatically sets it to multipart/form-data with the correct boundary string.
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}. Upload failed.`);
    }

    const data: UploadedImagesResponse = await response.json();
    setUploadedImages(data);

    // Go to render page
    // Redirect to render page passing all accumulated states
    navigate('/product-ads/phonk-style/render', {
      state: {
        audioData: audioData,        // From Card 1 (GET)
        audioGenData: audioGenData,  // From Card 3 (POST)
        uploadedImages: data         // From Card 4 (POST)
      }
    });

  } catch (err: any) {
    setUploadError(err.message || 'An error occurred while uploading the advertisement images.');
  } finally {
    setIsUploading(false);
  }
};

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-100">
              
              {/* 1. FIXED TOPBAR */}
              <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                  <Link to="/" className="text-xl font-bold tracking-tight text-zinc-900">
                    AutoReel<span className="text-zinc-500">Engine</span>
                  </Link>
        
                  {/* Desktop Navigation */}
                  <nav className="hidden md:flex items-center space-x-8">
                    {features.map((feature) => (
                      <Link
                        key={feature.id}
                        to={feature.slug}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                      >
                        {feature.name}
                      </Link>
                    ))}
                  </nav>
        
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 focus:outline-none"
                    aria-label="Toggle Menu"
                  >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
        
                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                  <nav className="md:hidden border-b border-zinc-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-sm">
                    {features.map((feature) => (
                      <Link
                        key={feature.id}
                        to={feature.slug}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2.5 rounded-lg text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                      >
                        {feature.name}
                      </Link>
                    ))}
                  </nav>
                )}
              </header>

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
                      ? 'opacity-100 translate-y-0 max-h-[600px]' 
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
                        className="w-full bg-white border border-gray-300 text-black py-2 px-3 rounded-xl file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-neutral-800 text-sm"
                      />
                      {selectedFiles.length > 0 && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'} selected.
                        </p>
                      )}
                    </div>

                    {/* Section Specific Error Notification */}
                    {uploadError && (
                      <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm font-medium">
                        {uploadError}
                      </div>
                    )}

                    {/* Update Action Trigger Button */}
                    <button
                      onClick={handleGenerateAdvertisement}
                      disabled={isUploading}
                      className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:bg-neutral-400"
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
                  </div>
                </div>
              </main>
            
        </div>
    )   
}