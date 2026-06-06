import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Sequence } from 'remotion';
import { Video, Audio } from '@remotion/media';
import educationalAudio from '@/assets/educational_audio.mp3';
import emotionalAudio from '@/assets/emotional_audio.mp3';
import energeticAudio from '@/assets/energetic_audio.mp3';
import peacefulAudio from '@/assets/peaceful_audio.mp3';
import funnyAudio from '@/assets/funny_audio.mp3';
import inspirationalAudio from '@/assets/inspirational_audio.mp3';

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

export interface TextToReelCompositionProps {
  finalVideoState: FinalVideoState;
  audioOutput: AudioOutput;
}

// Map lookups linking tone string keys directly to imported modules
const bgmMapping: Record<AudioOutput['tone'], string> = {
  educational: educationalAudio,
  emotional: emotionalAudio,
  energetic: energeticAudio,
  peaceful: peacefulAudio,
  funny: funnyAudio,
  inspirational: inspirationalAudio,
};

// Global uniform layout adjustment dictionary
const globalCaptionStyle = {
  fontFamily: 'Impact, Arial Black, sans-serif',
  fontSize: 76,
  primaryColor: '#FFFF00', // Neon yellow for high hackathon readability
  outlineColor: '#000000',
  positionY: 75, // Lower-third positioning
};

export const TextToReelComposition: React.FC<TextToReelCompositionProps> = ({
  finalVideoState,
  audioOutput,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // 2. Select the matching background track based on incoming payload data
  const backgroundMusicSource = bgmMapping[audioOutput.tone] || inspirationalAudio;

  // 1. Locate the active text subtitle segment block
  const activeCaption = audioOutput.captions?.find(
    (cap) => currentTime >= cap.start && currentTime < cap.end
  );

  const captionStartFrame = activeCaption ? Math.round(activeCaption.start * fps) : 0;

  // 2. Spring-loaded animation scale matching your layout setup
  const scale = activeCaption
    ? spring({
        frame: frame - captionStartFrame,
        fps,
        config: { damping: 12, stiffness: 220, mass: 0.5 },
        from: 0.8,
        to: 1,
      })
    : 1;

  // Multi-layered shadow simulation to drop clean text definitions onto bright videos
  const textShadow = `
    0px 0px 10px rgba(0, 0, 0, 0.95),
    -3px -3px 0px ${globalCaptionStyle.outlineColor},
    3px -3px 0px ${globalCaptionStyle.outlineColor},
    -3px 3px 0px ${globalCaptionStyle.outlineColor},
    3px 3px 0px ${globalCaptionStyle.outlineColor},
    4px 6px 12px rgba(0,0,0,0.8)
  `;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* LAYER 1: Master Audio Track */}
      {audioOutput.audio_url && (
        <Audio src={audioOutput.audio_url} volume={1.0} />
      )}

      {/* LAYER 1b: Continuous Background Ambience Loop (40% Volume) */}
      {backgroundMusicSource && (
        <Audio 
          src={backgroundMusicSource} 
          volume={0.4} 
          loop 
        />
      )}

      {/* LAYER 2: Video Asset Timeline Sequences */}
      {finalVideoState.map((paragraph) => {
        // Track continuous local runtime progression within the paragraph boundary block
        let currentVideoOffset = paragraph.start;

        return paragraph.videos.map((video, videoIdx) => {
          const startFrame = Math.round(currentVideoOffset * fps);
          const durationInFrames = Math.ceil(video.duration * fps);
          
          // Increment tracking offset marker forward for the next sequential loop segment
          currentVideoOffset += video.duration;

          const videoSource = video.download_link || video.url;
          if (!videoSource) return null;

          // Compute execution playback rate context. If stretch factor is 1.5, playback rate becomes 1/1.5 = 0.66x (Slower)
          const targetPlaybackRate = video.stretch > 1 ? 1 / video.stretch : 1;

          return (
            <Sequence
              key={`p-${paragraph.paragraph_id}-v-${videoIdx}`}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <Video
                src={videoSource}
                muted
                playbackRate={targetPlaybackRate}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill', // Squashes/stretches odd aspect ratios straight into your 1080x1920 viewport container
                }}
              />
            </Sequence>
          );
        });
      })}

      {/* LAYER 3: Dynamic Word-by-Word Subtitle Overlays */}
      {activeCaption && (
        <div
          style={{
            zIndex: 50,
            position: 'absolute',
            top: `${globalCaptionStyle.positionY}%`,
            left: '50%',
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'center center',
            width: '85%',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            fontSize: `${globalCaptionStyle.fontSize}px`,
            fontFamily: globalCaptionStyle.fontFamily,
            fontWeight: 900,
            color: globalCaptionStyle.primaryColor,
            textTransform: 'uppercase',
            textShadow,
            lineHeight: 1.25,
          }}
        >
          {activeCaption.text}
        </div>
      )}
    </AbsoluteFill>
  );
};