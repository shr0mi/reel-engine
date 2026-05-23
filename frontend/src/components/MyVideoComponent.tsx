import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Video } from '@remotion/media';

export const MyVideoComponent: React.FC = () => {
    // Point this directly to your FastAPI local endpoint
    const videoUrl = "http://localhost:8000/api/video";

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* 1. The Background Video Layer */}
      <Video 
        src={videoUrl}
        credentials="include"              // correct prop for cross-origin auth/cookies
        fallbackOffthreadVideoProps={{
            crossOrigin: "anonymous"         // crossOrigin goes here, for the SSR fallback
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover' // Adjust to 'contain' if you don't want the video cropped
        }}
      />

      {/* 2. The Centered Text Overlay Layer */}
      <AbsoluteFill style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none' // Ensures the text overlay doesn't block video interactions
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '80px',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 'bold',
          textShadow: '0px 4px 20px rgba(0, 0, 0, 0.6)', // Makes text readable over any b-roll
          margin: 0,
          textAlign: 'center'
        }}>
          Hello from FastAPI!
        </h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};