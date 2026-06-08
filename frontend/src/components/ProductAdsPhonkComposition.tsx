import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, Sequence } from 'remotion';
import { Audio } from '@remotion/media';

// --- Interfaces ---
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

export interface ProductAdsPhonkCompositionProps {
  audioData: PhonkAudioData;
  audioGenData: AudioGenData;
  uploadedImages: UploadedImagesData;
}

const PhonkImageEffect: React.FC<{ imgUrl: string; durationInFrames: number }> = ({ imgUrl, durationInFrames }) => {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // TikTok Style 1: Smooth Continuous Pan and Slow Zoom-In (Ken Burns)
  const scale = interpolate(localFrame, [0, durationInFrames], [1.1, 1.25], {
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(localFrame, [0, durationInFrames], [-20, 20]);
  const translateY = interpolate(localFrame, [0, durationInFrames], [10, -10]);

  // TikTok Style 2: Intense Exposure/White Flash at the cut boundary frame
  const flashBrightness = interpolate(localFrame, [0, 7], [3.0, 1.0], {
    extrapolateRight: 'clamp',
  });

  // Anime Style 3: Impact Scale Burst Shake right at the transition point
  const impactShake = spring({
    frame: localFrame,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.3 },
    from: 1.15,
    to: 1.0,
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={imgUrl}
        alt="Ad visual asset"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale * impactShake}) translateX(${translateX}px) translateY(${translateY}px)`,
          filter: `brightness(${flashBrightness})`,
        }}
      />
    </AbsoluteFill>
  );
};

export const ProductAdsPhonkComposition: React.FC<ProductAdsPhonkCompositionProps> = ({
  audioData,
  audioGenData,
  uploadedImages,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const ttsDuration = audioGenData.tts_audio_duration;
  const climaxPoint = Number(audioData.climax_point);

  // 1. Filter out valid images dynamically
  const imageUrls = [
    uploadedImages.image1_url,
    uploadedImages.image2_url,
    uploadedImages.image3_url,
    uploadedImages.image4_url,
    uploadedImages.image5_url,
  ].filter(Boolean);

  // 2. Audio Timing Calculations
  // Phonk plays from start, but startFrom changes to align the drop precisely when TTS ends
  const phonkStartFromSeconds = Math.max(0, climaxPoint - ttsDuration);
  const phonkStartFromFrames = Math.round(phonkStartFromSeconds * fps);

  // 3. Caption Text Selection & Animation
  const activeCaption = audioGenData.caption.find(
    (cap) => currentTime >= cap.start && currentTime < cap.end
  );

  const captionStartFrame = activeCaption ? Math.round(activeCaption.start * fps) : 0;
  const captionScale = activeCaption
    ? spring({
        frame: frame - captionStartFrame,
        fps,
        config: { damping: 10, stiffness: 300, mass: 0.4 },
        from: 0.7,
        to: 1,
      })
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', fontFamily: 'Impact, Arial Black, sans-serif' }}>
      
      {/* ========================================== */}
      {/* AUDIO LAYER                                */}
      {/* ========================================== */}
      {/* Voiceover TTS Asset */}
      {audioGenData.tts_audio_url && (
        <Audio src={audioGenData.tts_audio_url} volume={2.5} />
      )}

      {/* Replace the Background Phonk Music component block with this updated prop: */}
        {audioData.audio_url && (
        <Audio 
            src={audioData.audio_url} 
            volume={0.3} 
            trimBefore={phonkStartFromFrames} // Fix: Swapped startFrom for trimBefore
        />
        )}

      {/* ========================================== */}
        {/* VISUAL IMAGE TIMELINE (POST-DROP LFO EDITS)*/}
        {/* ========================================== */}
        {imageUrls.map((imgUrl, index) => {
        const durationPerImage = 2;
        
        // Explicitly calculate layout timeline milestones in frame units
        const startFrame = Math.round((ttsDuration + (index * durationPerImage)) * fps);
        const durationInFrames = durationPerImage * fps;

        return (
            <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
            layout="none"
            >
            <PhonkImageEffect imgUrl={imgUrl} durationInFrames={durationInFrames} />
            </Sequence>
        );
        })}

      {/* ========================================== */}
      {/* CAPTION OVERLAY LAYER                      */}
      {/* ========================================== */}
      {activeCaption && currentTime <= ttsDuration && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${captionScale})`,
            width: '90%',
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: '90px',
            fontWeight: 900,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            letterSpacing: '2px',
            // High-energy typography white glow system requested
            textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.6), 0 4px 10px rgba(0,0,0,0.5)',
          }}
        >
          {activeCaption.text}
        </div>
      )}
    </AbsoluteFill>
  );
};