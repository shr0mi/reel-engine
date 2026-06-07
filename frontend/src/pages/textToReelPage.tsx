import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

// Script Generation Interfaces (first section)
interface ScriptInput {
  prompt: string;
  language: "en" | "bn";
  duration: 40 | 60 | 120;
}

interface StoryBlock {
  paragraph: number;
  spoken_text: string;
  visual_prompt: string[];
}

interface ScriptOutput {
  tone: string;
  story_blocks: StoryBlock[];
}

// Audio Generation Interfaces (second section)
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

// Fetch Videos Interfaces (third section)
interface VideoItem {
  id: string | number;
  duration: number;
  url: string;
  download_link: string;
  width: number;
  height: number;
}

interface VideoStoryBlock {
  paragraph_id: number;
  start: number;
  end: number;
  visual_prompt: string[];
  videos_per_prompt: VideoItem[][];
}

interface VideoOutput {
  story_blocks: VideoStoryBlock[];
}

// Final Video Generation Interfaces (fourth section)
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

interface SlotConfiguration {
  targetDuration: number;
  promptIndex: number;
  videoIndex: number;
}

interface ParagraphSlotConfig {
  paragraph_id: number;
  start: number;
  end: number;
  slots: SlotConfiguration[];
}

export default function TextToReelPage() {
  const navigate = useNavigate();

  // Script Generation States (first section)
  const [scriptInput, setScriptInput] = useState<ScriptInput>({
    prompt: "",
    language: "en",
    duration: 60,
  });
  const [scriptOutput, setScriptOutput] = useState<ScriptOutput | null>(null);
  const [isScriptLoading, setIsScriptLoading] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Audio Generation States (second section)
  const [audioOutput, setAudioOutput] = useState<AudioOutput | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioSectionVisible, setIsAudioSectionVisible] =
    useState<boolean>(false);

  // Fetch Videos States (third section)
  const [videoOutput, setVideoOutput] = useState<VideoOutput | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoSectionVisible, setIsVideoSectionVisible] =
    useState<boolean>(false);

  // Final Video Generation States (fourth section)
  const [chunkDuration, setChunkDuration] = useState<number>(4);
  const [slotConfigs, setSlotConfigs] = useState<ParagraphSlotConfig[]>([]);
  const [finalVideoState, setFinalVideoState] =
    useState<FinalVideoState | null>(null);
  const [isFinalSectionVisible, setIsFinalSectionVisible] =
    useState<boolean>(false);

  // Helper: Calculate Video Allocation
  const generateInitialSlots = (
    videoData: VideoOutput,
    targetChunkLen: number,
  ): ParagraphSlotConfig[] => {
    return videoData.story_blocks.map((block) => {
      const totalDuration = block.end - block.start;
      let chunksCount = Math.floor(totalDuration / targetChunkLen);
      if (chunksCount === 0) chunksCount = 1;

      const rrSequence: { pIdx: number; vIdx: number }[] = [];
      const numPrompts = block.videos_per_prompt.length;
      const maxVideosInAPrompt = Math.max(
        ...block.videos_per_prompt.map((v) => v.length),
        0,
      );

      for (let v = 0; v < maxVideosInAPrompt; v++) {
        for (let p = 0; p < numPrompts; p++) {
          if (v < block.videos_per_prompt[p].length) {
            rrSequence.push({ pIdx: p, vIdx: v });
          }
        }
      }

      const slots: SlotConfiguration[] = [];
      for (let i = 0; i < chunksCount; i++) {
        const isLast = i === chunksCount - 1;
        const targetDuration = isLast
          ? totalDuration - (chunksCount - 1) * targetChunkLen
          : targetChunkLen;
        const coord = rrSequence[i % rrSequence.length] || { pIdx: 0, vIdx: 0 };
        slots.push({
          targetDuration,
          promptIndex: coord.pIdx,
          videoIndex: coord.vIdx,
        });
      }

      return {
        paragraph_id: block.paragraph_id,
        start: block.start,
        end: block.end,
        slots,
      };
    });
  };

  useEffect(() => {
    if (videoOutput) {
      const updatedConfigs = generateInitialSlots(videoOutput, chunkDuration);
      setSlotConfigs(updatedConfigs);
    }
  }, [chunkDuration, videoOutput]);

  // Script Generation
  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScriptLoading(true);
    setScriptError(null);
    setIsAudioSectionVisible(false);
    setIsVideoSectionVisible(false);
    setIsFinalSectionVisible(false);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/text-to-reel/generate-script",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scriptInput),
        },
      );
      if (!response.ok)
        throw new Error(`Server responded with a status of ${response.status}`);
      const data: ScriptOutput = await response.json();
      setScriptOutput(data);
      setIsAudioSectionVisible(true);
    } catch (err: any) {
      setScriptError(
        err.message ||
          "An unexpected error occurred while generating the script.",
      );
    } finally {
      setIsScriptLoading(false);
    }
  };

  const handleParagraphChange = (index: number, newValue: string) => {
    if (!scriptOutput) return;
    const updatedBlocks = scriptOutput.story_blocks.map((block, i) =>
      i === index ? { ...block, spoken_text: newValue } : block,
    );
    setScriptOutput({ ...scriptOutput, story_blocks: updatedBlocks });
  };

  // Audio Generation
  const handleGenerateAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptOutput) return;
    setIsAudioLoading(true);
    setAudioError(null);
    setIsVideoSectionVisible(false);
    setIsFinalSectionVisible(false);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/text-to-reel/generate-audio?language=${scriptInput.language}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scriptOutput),
        },
      );
      if (!response.ok)
        throw new Error(
          `Audio generation failed with status ${response.status}`,
        );
      const data: AudioOutput = await response.json();
      setAudioOutput(data);
      setIsVideoSectionVisible(true);
    } catch (err: any) {
      setAudioError(
        err.message ||
          "An unexpected error occurred while generating the audio.",
      );
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleVisualPromptChange = (
    blockIndex: number,
    promptIndex: number,
    newValue: string,
  ) => {
    if (!audioOutput) return;
    const updatedBlocks = audioOutput.story_blocks.map((block, bIdx) => {
      if (bIdx === blockIndex) {
        const updatedPrompts = block.visual_prompt.map((prompt, pIdx) =>
          pIdx === promptIndex ? newValue : prompt,
        );
        return { ...block, visual_prompt: updatedPrompts };
      }
      return block;
    });
    setAudioOutput({ ...audioOutput, story_blocks: updatedBlocks });
  };

  // Fetch Videos
  const handleFetchVideos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioOutput) return;
    setIsVideoLoading(true);
    setVideoError(null);
    setIsFinalSectionVisible(false);

    const payload = {
      story_blocks: audioOutput.story_blocks.map((block) => ({
        paragraph_id: block.paragraph_id,
        start: block.start,
        end: block.end,
        visual_prompt: block.visual_prompt.filter(
          (prompt) => prompt.trim() !== "",
        ),
      })),
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/text-to-reel/fetch-videos",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok)
        throw new Error(`Video fetching failed with status ${response.status}`);
      const data: VideoOutput = await response.json();
      const adjustedStoryBlocks = data.story_blocks.map((block, index) => {
        if (index === 0) return { ...block, start: 0 };
        return { ...block, start: data.story_blocks[index - 1].end };
      });
      setVideoOutput({ ...data, story_blocks: adjustedStoryBlocks });
      setIsFinalSectionVisible(true);
    } catch (err: any) {
      setVideoError(
        err.message || "An unexpected error occurred while fetching videos.",
      );
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleCycleVideoSelection = (
    paragraphId: number,
    slotIndex: number,
  ) => {
    if (!videoOutput) return;
    setSlotConfigs((prevConfigs) =>
      prevConfigs.map((pConfig) => {
        if (pConfig.paragraph_id !== paragraphId) return pConfig;
        const targetBlock = videoOutput.story_blocks.find(
          (b) => b.paragraph_id === paragraphId,
        );
        if (!targetBlock) return pConfig;
        const updatedSlots = pConfig.slots.map((slot, sIdx) => {
          if (sIdx !== slotIndex) return slot;
          const totalAvailableVideos =
            targetBlock.videos_per_prompt[slot.promptIndex]?.length || 0;
          if (totalAvailableVideos <= 1) return slot;
          return {
            ...slot,
            videoIndex: (slot.videoIndex + 1) % totalAvailableVideos,
          };
        });
        return { ...pConfig, slots: updatedSlots };
      }),
    );
  };

  const handleCompileFinalVideoState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoOutput) return;

    const compiledState: FinalVideoState = slotConfigs.map((config) => {
      const srcBlock = videoOutput.story_blocks.find(
        (b) => b.paragraph_id === config.paragraph_id,
      )!;
      const videos: FinalVideoItem[] = config.slots.map((slot) => {
        const pool = srcBlock.videos_per_prompt[slot.promptIndex] || [];
        const asset = pool[slot.videoIndex];
        if (!asset)
          return {
            duration: slot.targetDuration,
            stretch: 1,
            url: "",
            download_link: "",
            width: 0,
            height: 0,
          };
        const stretch =
          slot.targetDuration > asset.duration
            ? slot.targetDuration / asset.duration
            : 1;
        return {
          duration: slot.targetDuration,
          stretch,
          url: asset.url,
          download_link: asset.download_link,
          width: asset.width,
          height: asset.height,
        };
      });
      return {
        paragraph_id: config.paragraph_id,
        start: config.start,
        end: config.end,
        videos,
      };
    });

    setFinalVideoState(compiledState);
    navigate("/text-to-reel/render", {
      state: { finalVideoState: compiledState, audioOutput },
    });
  };

  return (
    <main className="pt-16 pb-16 max-w-xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-8 text-center">
        Text to Reel
      </h1>

      {/* First section: Script Generation */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleGenerateScript} className="space-y-5">
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Prompt
            </label>
            <textarea
              id="prompt"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm resize-none"
              placeholder="Describe your video idea..."
              value={scriptInput.prompt}
              onChange={(e) =>
                setScriptInput({ ...scriptInput, prompt: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Language
              </label>
              <select
                id="language"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm"
                value={scriptInput.language}
                onChange={(e) =>
                  setScriptInput({
                    ...scriptInput,
                    language: e.target.value as "en" | "bn",
                  })
                }
              >
                <option value="en">English (en)</option>
                <option value="bn">Bengali (bn)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Duration (seconds)
              </label>
              <select
                id="duration"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm"
                value={scriptInput.duration}
                onChange={(e) =>
                  setScriptInput({
                    ...scriptInput,
                    duration: Number(e.target.value) as 40 | 60 | 120,
                  })
                }
              >
                <option value={40}>40s</option>
                <option value={60}>60s</option>
                <option value={120}>120s</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isScriptLoading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 disabled:bg-neutral-400 flex items-center justify-center gap-2"
          >
            {isScriptLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Script...
              </>
            ) : (
              "Generate Script"
            )}
          </button>
        </form>

        {scriptError && (
          <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-lg text-red-600 text-sm font-medium">
            {scriptError}
          </div>
        )}
      </div>

      {/* Second section: Audio Generation */}
      <div
        className={`transition-all mt-4 duration-500 ease-in-out origin-top ${
          isAudioSectionVisible
            ? "opacity-100 max-h-[2000px] translate-y-0"
            : "opacity-0 max-h-0 -translate-y-4 overflow-hidden pointer-events-none"
        }`}
      >
        {scriptOutput && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">
              Edit Script Paragraphs
            </h2>
            <form onSubmit={handleGenerateAudio} className="space-y-4">
              <div className="space-y-4">
                {scriptOutput.story_blocks.map((block, index) => (
                  <div key={index}>
                    <label
                      htmlFor={`paragraph-${index}`}
                      className="block text-xs font-medium text-gray-500 mb-1"
                    >
                      Paragraph {index + 1}
                    </label>
                    <textarea
                      id={`paragraph-${index}`}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm resize-none"
                      value={block.spoken_text}
                      onChange={(e) =>
                        handleParagraphChange(index, e.target.value)
                      }
                      required
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={isAudioLoading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 disabled:bg-neutral-400 flex items-center justify-center gap-2"
              >
                {isAudioLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Audio...
                  </>
                ) : (
                  "Generate Audio"
                )}
              </button>
            </form>
            {audioError && (
              <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-lg text-red-600 text-sm font-medium">
                {audioError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Third section: Fetch Videos */}
      <div
        className={`transition-all mt-4 duration-500 ease-in-out origin-top ${
          isVideoSectionVisible
            ? "opacity-100 max-h-[3000px] translate-y-0"
            : "opacity-0 max-h-0 -translate-y-4 overflow-hidden pointer-events-none"
        }`}
      >
        {audioOutput && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-medium text-neutral-900 mb-3">
                Generated Audio
              </h2>
              <audio
                src={audioOutput.audio_url}
                controls
                className="w-full accent-neutral-900"
              />
            </div>

            <form onSubmit={handleFetchVideos} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                  Configure Visual Prompts
                </h3>
                <div className="space-y-5">
                  {audioOutput.story_blocks.map((block, blockIndex) => {
                    const staticSpokenText =
                      scriptOutput?.story_blocks[blockIndex]?.spoken_text || "";
                    return (
                      <div
                        key={blockIndex}
                        className="p-4 bg-white border border-gray-200 rounded-lg space-y-3 shadow-inner"
                      >
                        <div>
                          <span className="text-xs font-bold text-neutral-400 block mb-1">
                            PARAGRAPH {blockIndex + 1} TEXT
                          </span>
                          <p className="text-sm text-neutral-700 font-normal leading-relaxed">
                            {staticSpokenText}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-neutral-400 block">
                            VISUAL PROMPTS
                          </span>
                          {block.visual_prompt.map((prompt, promptIndex) => (
                            <input
                              key={promptIndex}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm"
                              value={prompt}
                              onChange={(e) =>
                                handleVisualPromptChange(
                                  blockIndex,
                                  promptIndex,
                                  e.target.value,
                                )
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isVideoLoading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 disabled:bg-neutral-400 flex items-center justify-center gap-2"
              >
                {isVideoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching Videos...
                  </>
                ) : (
                  "Fetch Videos"
                )}
              </button>
            </form>

            {videoError && (
              <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-lg text-red-600 text-sm font-medium">
                {videoError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fourth section: Final Video Generation */}
      <div
        className={`transition-all mt-4 duration-500 ease-in-out origin-top ${
          isFinalSectionVisible
            ? "opacity-100 max-h-[4000px] translate-y-0"
            : "opacity-0 max-h-0 -translate-y-4 overflow-hidden pointer-events-none"
        }`}
      >
        {videoOutput && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-lg font-medium text-neutral-900">
                Compile Timeline
              </h2>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="chunk-dur"
                  className="text-xs font-medium text-gray-500 whitespace-nowrap"
                >
                  Base Duration (s):
                </label>
                <input
                  id="chunk-dur"
                  type="number"
                  min={1}
                  max={20}
                  className="w-14 px-2 py-1 border border-gray-300 rounded bg-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  value={chunkDuration}
                  onChange={(e) =>
                    setChunkDuration(Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
            </div>

            <form onSubmit={handleCompileFinalVideoState} className="space-y-6">
              <div className="space-y-4">
                {slotConfigs.map((pConfig) => {
                  const originalBlock = videoOutput.story_blocks.find(
                    (b) => b.paragraph_id === pConfig.paragraph_id,
                  )!;
                  return (
                    <div
                      key={pConfig.paragraph_id}
                      className="p-4 bg-white border border-gray-200 rounded-lg space-y-3 shadow-inner"
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-neutral-400 border-b border-gray-100 pb-1.5">
                        <span>PARAGRAPH {pConfig.paragraph_id} TIMELINE</span>
                        <span className="font-mono text-neutral-500">
                          {(pConfig.end - pConfig.start).toFixed(1)}s total
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {pConfig.slots.map((slot, sIdx) => {
                          const currentAsset =
                            originalBlock.videos_per_prompt[slot.promptIndex]?.[
                              slot.videoIndex
                            ];
                          const calculatedStretch =
                            currentAsset &&
                            slot.targetDuration > currentAsset.duration
                              ? slot.targetDuration / currentAsset.duration
                              : 1;
                          return (
                            <div
                              key={sIdx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-neutral-900 text-xs">
                                    Slot {sIdx + 1} (
                                    {slot.targetDuration.toFixed(1)}s)
                                  </span>
                                  {calculatedStretch > 1 && (
                                    <span className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                                      Stretch: {calculatedStretch.toFixed(2)}x
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate font-mono">
                                  <a
                                    href={currentAsset ? currentAsset.url : "#"}
                                    target="_blank"
                                  >
                                    {currentAsset
                                      ? currentAsset.url
                                      : "No video available"}
                                  </a>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCycleVideoSelection(
                                    pConfig.paragraph_id,
                                    sIdx,
                                  )
                                }
                                className="self-end sm:self-auto bg-white hover:bg-gray-100 border border-gray-200 text-xs font-medium px-2.5 py-1 rounded shadow-sm transition-colors"
                              >
                                Change
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
              >
                Generate Video
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
