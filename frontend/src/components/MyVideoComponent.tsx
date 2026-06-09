import React, { useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Sequence } from 'remotion';
import { Video } from '@remotion/media';
import '../App.css';

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

export interface MyVideoProps {
  globalStyles: GlobalStyles;
  segments: CaptionSegment[];
  emojiData: EmojiPayload;
  bRollData: BRollData[];
}

export const MyVideoComponent: React.FC<MyVideoProps> = ({ globalStyles, segments, emojiData, bRollData }) => {
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
    console.log('Caption and B-Roll data received in MyVideoComponent:', { globalStyles, segments, bRollData });
  }, [globalStyles, segments, bRollData]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Layer 1: Base background talking-head video - Stretched to fit */}
      <Video
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'fill' }}
      />

      {/* Layer 2: Overlaid B-Roll Clips mapped onto the layout sequence timeline - Stretched to fit */}
      {bRollData?.map((bRoll) => {
        const fromFrame = Math.round(bRoll.start * fps);
        // Calculate total runtime in frames based on start/end parameters (ignoring asset duration metadata)
        const durationInFrames = Math.max(1, Math.round((bRoll.end - bRoll.start) * fps));

        return (
          <Sequence
            key={bRoll.b_roll_id}
            from={fromFrame}
            durationInFrames={durationInFrames}
          >
            <Video
              src={bRoll.download_link}
              style={{ width: '100%', height: '100%', objectFit: 'fill' }}
              muted // Muted so it does not conflict with the primary track's audio mix
            />
          </Sequence>
        );
      })}

      {/* Layer 3: Captions — absolutely positioned on top of background and B-rolls */}
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

      {/* Layer 4: Emojis - Positioned correctly and scaled from center */}
      {activeEmojiSegment && (
            <div
              className="absolute text-center pointer-events-none select-none transition-all duration-75 rounded-lg px-3 py-1"
              style={{
                zIndex: 11,
                left: '50%', // Define horizontal start point
                top: `${emojiData?.globalStyles.positionY}%`, // Apply vertical position
                // Combine horizontal centering AND scale in one transform for clean application
                transform: `translateX(-50%) scale(${emojiScale})`,
                fontFamily: globalStyles.fontFamily,
                fontSize: `${emojiData?.globalStyles.fontSize * 2.7}px`,
                backgroundColor: emojiData?.globalStyles.backgroundColor,
              }}
            >
              {activeEmojiSegment.emoji}
            </div>
      )}
    </AbsoluteFill>
  );
};