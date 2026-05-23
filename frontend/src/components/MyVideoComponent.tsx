import React, {useEffect} from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Video } from '@remotion/media';

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

export interface MyVideoProps {
  globalStyles: GlobalStyles;
  segments: CaptionSegment[];
}

export const MyVideoComponent: React.FC<MyVideoProps> = ({ globalStyles, segments }) => {
  const videoUrl = "http://localhost:8000/api/video";
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTime = frame / fps;

  const activeSegment = segments?.find(
    (seg) => currentTime >= seg.start && currentTime < seg.end
  );

  const segmentStartFrame = activeSegment
    ? Math.round(activeSegment.start * fps)
    : 0;

  const scale = activeSegment
    ? spring({
        frame: frame - segmentStartFrame,
        fps,
        config: { damping: 12, stiffness: 200, mass: 0.5 },
        from: 0.75,
        to: 1,
      })
    : 1;

  const {
    fontFamily = 'system-ui, sans-serif',
    fontSize = 72,
    primaryColor = '#FFFFFF',
    strokeColor = '#000000',
    strokeWidth = 6,
    positionY = 75,
  } = globalStyles ?? {};

  // Mirror your working HTML5 preview: 4-shadow stroke technique
  const textShadow = `
    -${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
     ${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
    -${strokeWidth}px  ${strokeWidth}px 0 ${strokeColor},
     ${strokeWidth}px  ${strokeWidth}px 0 ${strokeColor}
  `;

  useEffect(() => {
    console.log('Caption data received in MyVideoComponent:', { globalStyles, segments });
  }, [globalStyles, segments]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Layer 1: Background video */}
      <Video
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Layer 2: Caption — absolutely positioned, mirrors the HTML5 preview layout */}
      {activeSegment && (
        <div
          style={{
            zIndex: 10,
            position: 'absolute',
            top: `${positionY}%`,
            left: '50%',
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'center top',
            width: '90%',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: 900,
            color: primaryColor,
            textTransform: 'uppercase',
            textShadow,
            lineHeight: 1.2,
          }}
        >
          {activeSegment.text}
        </div>
      )}

      {/* <div style={{ position: 'absolute', top: '75%', left: '50%', color: 'white', zIndex: 10 }}>
        TEST
      </div> */}
    </AbsoluteFill>
  );
};