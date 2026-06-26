import { useState } from 'react';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import { TextToReelComposition } from './TextToReelComposition'; // Placeholder path for later implementation

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

interface ExporterProps {
  finalVideoState: FinalVideoState;
  audioOutput: AudioOutput;
}

export default function TextToReelVideoExporter({ finalVideoState, audioOutput }: ExporterProps) {
  const [status, setStatus] = useState<'idle' | 'rendering' | 'error' | 'success'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleExport = async () => {
    setStatus('rendering');
    setProgress(0);

    const fps = 30;
    
    // Dynamically calculate composition length using the last paragraph's end timestamp
    const maxSeconds = finalVideoState[finalVideoState.length - 1].end;
    const durationInFrames = Math.ceil(maxSeconds * fps);

    try {
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: 'text-to-reel-render',
          component: TextToReelComposition,
          durationInFrames: durationInFrames,
          fps: fps,
          width: 1080,
          height: 1920,
          defaultProps: {
            finalVideoState,
            audioOutput,
          },
        },
        inputProps: {
          finalVideoState,
          audioOutput,
        },
        container: 'mp4',
        videoCodec: 'h264',
        onProgress: ({ progress: currentProgress }) => {
          setProgress(Math.round(currentProgress * 100));
        },
      });

      // Wait for compile frames into single browser-rendered video payload Blob
      const videoBlob = await getBlob();

      // Trigger automatic file download anchor link injection
      const videoUrl = URL.createObjectURL(videoBlob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = videoUrl;
      downloadAnchor.download = 'text-to-reel-output.mp4';
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      // Clean up local system cache mappings
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(videoUrl);

      setStatus('success');
    } catch (error) {
      console.error('Text-to-Reel render failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred during processing');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-background text-foreground p-5 transition-colors duration-300">
      <div className="bg-card text-card-foreground p-10 rounded-xl shadow-md text-center max-w-md w-full border border-border">
        <h2 className="mb-2.5 text-2xl font-semibold">
          Reel Video Exporter
        </h2>
        <p className="text-muted-foreground mb-7 text-sm leading-relaxed">
          Compiling your custom timeline assets into a high-definition 1080x1920 video using browser web rendering.
        </p>

        {/* Dynamic Action Button */}
        <button
          onClick={handleExport}
          disabled={status === 'rendering'}
          className={`w-full px-6 py-3 text-[15px] font-semibold rounded-lg border-none text-primary-foreground transition-colors duration-150 ${
            status === 'rendering'
              ? 'bg-muted cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 cursor-pointer'
          }`}
        >
          {status === 'rendering' ? `Compiling Matrix (${progress}%)` : 'Export MP4 Reel'}
        </button>

        {/* Progress Bar */}
        {status === 'rendering' && (
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-2 mt-4 bg-secondary rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Status Messaging */}
        {status === 'success' && (
          <p className="text-emerald-600 dark:text-emerald-400 mt-5 font-medium text-sm">
            🎉 Reel compiled and downloaded successfully!
          </p>
        )}

        {status === 'error' && (
          <div className="text-destructive mt-5 text-sm text-left">
            <p className="font-semibold mb-1">❌ Render Execution Halted</p>
            <p className="opacity-80 break-words font-mono bg-destructive/10 p-2 rounded">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}