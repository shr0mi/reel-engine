import React, {useEffect} from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Video } from '@remotion/media';
import '../App.css';

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

export interface MyVideoProps {
  globalStyles: GlobalStyles;
  segments: CaptionSegment[];
  emojiData: EmojiPayload;
}

export const MyVideoComponent: React.FC<MyVideoProps> = ({ globalStyles, segments, emojiData }) => {
  const videoUrl = "http://localhost:8000/api/video";
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTime = frame / fps;

  const activeSegment = segments?.find(
    (seg) => currentTime >= seg.start && currentTime < seg.end
  );

  const activeEmojiSegment = emojiData?.data?.find(
    (seg) => currentTime >= seg.start && currentTime < seg.end
  );

  const segmentStartFrame = activeSegment
    ? Math.round(activeSegment.start * fps)
    : 0;

  const emojiSegmentStartFrame = activeEmojiSegment
    ? Math.round(activeEmojiSegment.start * fps)
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

  const emojiScale = activeEmojiSegment
    ? spring({
        frame: frame - emojiSegmentStartFrame,
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

  useEffect(() => {
    console.log(fontFamily);
  }, []);

  // Mirror your working HTML5 preview: 4-shadow stroke technique
  const textShadow = `
                /* 1. Sharp core glow to keep letters crisp */
                0 0 4px ${globalStyles.primaryColor},
                
                /* 3. Wide, soft background glow (simulating light bleed) */
                0 0 24px ${globalStyles.primaryColor},

                /* NEW: Tight black shadow sticking directly to the letters */
                0px 0px ${globalStyles.fontSize/5}px rgba(0, 0, 0, 0.95),
                
                /* 4. Deep, soft drop shadow to push the text off the background */
                2px 4px 8px rgba(0, 0, 0, 0.9),
                4px 8px 16px rgba(0, 0, 0, 0.6)
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
        <div className={`${globalStyles.fontFamily ?? "font-impact"}`}
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
            fontSize: `${Math.round(fontSize * 2.7)}px`,
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

      {activeEmojiSegment && (
            <div
              className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none select-none transition-all duration-75 rounded-lg px-3 py-1"
              style={{
                top: `${emojiData?.globalStyles.positionY}%`,
                fontFamily: globalStyles.fontFamily,
                fontSize: `${emojiData?.globalStyles.fontSize * 2.7}px`,
                backgroundColor: emojiData?.globalStyles.backgroundColor,
              }}
            >
              {activeEmojiSegment.emoji}
            </div>
      )}

      {/* <div style={{ position: 'absolute', top: '75%', left: '50%', color: 'white', zIndex: 10 }}>
        TEST
      </div> */}
    </AbsoluteFill>
  );
};