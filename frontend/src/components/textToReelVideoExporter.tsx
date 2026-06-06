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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f3f4f6',
      color: '#1f2937',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ marginBottom: '10px', fontSize: '24px', fontWeight: '600' }}>
          Reel Video Exporter
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '14px', lineHeight: '1.5' }}>
          Compiling your custom timeline assets into a high-definition 1080x1920 video using browser web rendering.
        </p>

        {/* Dynamic Action Button */}
        <button
          onClick={handleExport}
          disabled={status === 'rendering'}
          style={{
            backgroundColor: status === 'rendering' ? '#9ca3af' : '#0f172a',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            borderRadius: '8px',
            cursor: status === 'rendering' ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
            width: '100%'
          }}
        >
          {status === 'rendering' ? `Compiling Matrix (${progress}%)` : 'Export MP4 Reel'}
        </button>

        {/* Status Messaging */}
        {status === 'success' && (
          <p style={{ color: '#16a34a', marginTop: '20px', fontWeight: '500', fontSize: '14px' }}>
            🎉 Reel compiled and downloaded successfully!
          </p>
        )}

        {status === 'error' && (
          <div style={{ color: '#dc2626', marginTop: '20px', fontSize: '14px', textAlign: 'left' }}>
            <p style={{ fontWeight: '600', marginBottom: '4px' }}>❌ Render Execution Halted</p>
            <p style={{ opacity: 0.8, wordBreak: 'break-word', fontFamily: 'monospace', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px' }}>
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}