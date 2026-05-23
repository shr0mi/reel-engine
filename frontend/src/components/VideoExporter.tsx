import { useEffect, useState } from 'react';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import { MyVideoComponent } from './MyVideoComponent';

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

export default function VideoExportPage({ captionData }: { captionData: CaptionPayload }) {
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

    try {
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: 'browser-render-demo',
          component: MyVideoComponent,
          durationInFrames: 300,
          fps: 30,
          width: 1920,
          height: 1080,
          // ✅ Pass caption data as input props to the composition
          
          defaultProps: {
            globalStyles: captionData.globalStyles,
            segments: captionData.segments,
            // Note: videoUrl is intentionally NOT forwarded —
            // MyVideoComponent always uses the hardcoded localhost URL
          },
        },
        inputProps: {
          globalStyles: captionData.globalStyles,
          segments: captionData.segments,
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
        <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>In-Browser Video Exporter</h2>
        <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '14px' }}>
          Uses Remotion CSR to render and download an MP4 entirely inside your browser.
        </p>

        {/* Dynamic Action Button */}
        <button
          onClick={handleExport}
          disabled={status === 'rendering'}
          style={{
            backgroundColor: status === 'rendering' ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '6px',
            cursor: status === 'rendering' ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            width: '100%'
          }}
        >
          {status === 'rendering' ? `Rendering (${progress}%)` : 'Export to MP4'}
        </button>

        {/* Status Messaging */}
        {status === 'success' && (
          <p style={{ color: '#16a34a', marginTop: '15px', fontWeight: '500' }}>
            🎉 Video downloaded successfully!
          </p>
        )}

        {status === 'error' && (
          <div style={{ color: '#dc2626', marginTop: '15px', fontSize: '14px' }}>
            <p style={{ fontWeight: '500' }}>❌ Render Failed</p>
            <p style={{ opacity: 0.8 }}>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}