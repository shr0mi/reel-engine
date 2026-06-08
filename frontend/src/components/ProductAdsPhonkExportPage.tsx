import React, { useState } from 'react';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import { Loader2 } from 'lucide-react';
import {ProductAdsPhonkComposition} from './ProductAdsPhonkComposition'

// Re-using composition placeholder component
const MyDummyVideoComponent = () => null;

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

interface ExportPageProps {
  audioData: PhonkAudioData;
  audioGenData: AudioGenData;
  uploadedImages: UploadedImagesData;
}

export default function ProductAdsPhonkExportPage({ 
  audioData, 
  audioGenData, 
  uploadedImages 
}: ExportPageProps) {
  
  const [status, setStatus] = useState<'idle' | 'rendering' | 'error' | 'success'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleExport = async () => {
    setStatus('rendering');
    setProgress(0);

    const fps = 30;

// 1. Get the actual number of uploaded images dynamically
const imageUrls = [
  uploadedImages.image1_url,
  uploadedImages.image2_url,
  uploadedImages.image3_url,
  uploadedImages.image4_url,
  uploadedImages.image5_url
].filter(Boolean); // Filters out empty strings if less than 5 images were uploaded

    const imageCount = imageUrls.length;

    // 2. Define your timing constants (in seconds)
    const SECONDS_PER_IMAGE = 2;
    const TRANSITION_DURATION = 0.5; // 0.5s fade/glitch transition per cut
    const totalTransitionTime = imageCount > 1 ? (imageCount - 1) * TRANSITION_DURATION : 0;

    // 3. Sum up the absolute timeline duration
    const ttsDuration = audioGenData.tts_audio_duration;
    const totalImageDuration = imageCount * SECONDS_PER_IMAGE;

    const totalDurationInSeconds = ttsDuration + totalImageDuration + totalTransitionTime;

    // 4. Convert to total frames for Remotion
    const durationInFrames = Math.ceil(totalDurationInSeconds * fps);

    try {
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: 'phonk-ad-render',
          component: ProductAdsPhonkComposition, // Swapped in once video track logic is built
          durationInFrames: durationInFrames,
          fps: fps,
          width: 1080,
          height: 1920,
          defaultProps: {
            audioData,
            audioGenData,
            uploadedImages,
          },
        },
        inputProps: {
          audioData,
          audioGenData,
          uploadedImages,
        },
        container: 'mp4',
        videoCodec: 'h264',
        onProgress: ({ progress: currentProgress }) => {
          setProgress(Math.round(currentProgress * 100));
        },
      });

      const videoBlob = await getBlob();
      const videoUrl = URL.createObjectURL(videoBlob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = videoUrl;
      downloadAnchor.download = 'phonk-product-advertisement.mp4';
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(videoUrl);

      setStatus('success');
    } catch (error) {
      console.error('Render execution failure:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown generation error');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white text-black">
      <div className="w-full max-w-md bg-gray-50 border border-gray-200 p-8 rounded-2xl shadow-sm text-center space-y-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2">Compile Video Ad</h2>
          <p className="text-gray-500 text-sm">
            Uses Remotion Client-Side Rendering to render and compile your high-energy phonk ad inside your browser.
          </p>
        </div>

        {/* Dynamic Action Button */}
        <button
          onClick={handleExport}
          disabled={status === 'rendering'}
          className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors"
        >
          {status === 'rendering' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rendering ({progress}%)
            </>
          ) : (
            'Export to MP4'
          )}
        </button>

        {/* Status Messaging feedback frameworks */}
        {status === 'success' && (
          <p className="text-emerald-600 font-semibold text-sm">
            🎉 Video downloaded successfully!
          </p>
        )}

        {status === 'error' && (
          <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm font-medium text-left">
            <p className="font-bold mb-1">❌ Render Failed</p>
            <p className="text-xs opacity-90 leading-relaxed">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}