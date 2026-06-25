import { useEffect, useState } from 'react';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import { MyVideoComponent } from './MyVideoComponent';

// --- Interfaces ---
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

interface EmojiSegment {
  id: number;
  start: number;
  end: number;
  emoji: string;
}

interface EmojiGlobalStyles {
  fontSize: number;
  positionY: number;
  backgroundColor: string;
}

interface EmojiPayload {
  status: string;
  data: EmojiSegment[];
  globalStyles: EmojiGlobalStyles;
}

interface BRollData {
  b_roll_id: number;
  query: string;
  start: number;
  end: number;
  duration: number;
  url: string;
  download_link: string;
  width: number;
  height: number;
}

interface VideoExportPageProps {
  captionData: CaptionPayload;
  emojiData: EmojiPayload;
  bRollData: BRollData[];
}

export default function VideoExportPage({ captionData, emojiData, bRollData }: VideoExportPageProps) {
  //  useEffect(() => {
  //      console.log(captionData);
  //      console.log(captionData.globalStyles)
  //    }, [captionData]);
  const [status, setStatus] = useState<'idle' | 'rendering' | 'error' | 'success'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleExport = async () => {
    // Reset state and lock the button
    setStatus('rendering');
    setProgress(0);

    const fps = 30;
    // Find the last of the video segments
    const maxSeconds = captionData.segments[captionData.segments.length - 1].end;
    const durationInFrames = Math.ceil(maxSeconds * fps);

    try {
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: 'browser-render-demo',
          component: MyVideoComponent,
          durationInFrames: durationInFrames,
          fps: fps,
          width: 1080,
          height: 1920,
          
          // Pass caption, emoji, and b-roll data as input props to the composition
          defaultProps: {
            globalStyles: captionData.globalStyles,
            segments: captionData.segments,
            emojiData: emojiData,
            bRollData: bRollData, // Forwarding B-Roll selections here
            // Note: videoUrl is intentionally NOT forwarded —
            // MyVideoComponent always uses the hardcoded localhost URL
          },
        },
        inputProps: {
          globalStyles: captionData.globalStyles,
          segments: captionData.segments,
          emojiData: emojiData,
          bRollData: bRollData, // Forwarding B-Roll selections here
        },
        container: 'mp4',
        videoCodec: 'h264',
        onProgress: ({ progress: currentProgress }) => {
          setProgress(Math.round(currentProgress * 100));
        },
      });

      // 2. Wait for the browser to compile the video frames into a Blob
      const videoBlob = await getBlob();

      // 3. Trigger the browser download
      const videoUrl = URL.createObjectURL(videoBlob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = videoUrl;
      downloadAnchor.download = 'remotion-browser-video.mp4';
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      // 4. Clean up
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(videoUrl);

      setStatus('success');
    } catch (error) {
      console.error('Render failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-sans px-5 py-5 pt-24 transition-colors duration-300">
      <div className="bg-card text-card-foreground border border-border p-10 rounded-xl shadow-md text-center max-w-[400px] w-full">
        <h2 className="mb-2.5 text-2xl font-semibold">In-Browser Video Exporter</h2>
        <p className="text-muted-foreground mb-7 text-sm">
          Uses Remotion CSR to render and download an MP4 entirely inside your browser.
        </p>

        {/* Dynamic Action Button */}
        <button
          onClick={handleExport}
          disabled={status === 'rendering'}
          className={`w-full px-6 py-3 text-base font-semibold rounded-md transition-colors duration-200 ${
            status === 'rendering'
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
          }`}
        >
          {status === 'rendering' ? `Rendering (${progress}%)` : 'Export to MP4'}
        </button>

        {/* Status Messaging */}
        {status === 'success' && (
          <p className="text-primary mt-4 font-medium">
            🎉 Video downloaded successfully!
          </p>
        )}

        {status === 'error' && (
          <div className="text-destructive mt-4 text-sm">
            <p className="font-medium">❌ Render Failed</p>
            <p className="opacity-80">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}