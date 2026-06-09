import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import Navbar from "@/components/Navbar";

// --- Interfaces ---
interface CaptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface GlobalStyles {
  // Add styling fields if needed
}

interface CaptionPayload {
  videoUrl: string;
  globalStyles: GlobalStyles;
  segments: CaptionSegment[];
}

interface VideoResult {
  id: number;
  duration: number;
  url: string;
  download_link: string;
  width: number;
  height: number;
}

interface BRollApiResponse {
  b_roll_id: number;
  query: string;
  start: number;
  end: number;
  results: VideoResult[];
}

interface FinalBRollData {
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

export default function CoolCaptionsBRollPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const { captionData, emojiData } = state as { captionData?: CaptionPayload; emojiData?: any };

  // --- States ---
  const [bRollResults, setBRollResults] = useState<BRollApiResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tracks selected video index for each b_roll_id: { [b_roll_id]: selectedIndex }
  const [selectedVideoIndices, setSelectedVideoIndices] = useState<Record<number, number>>({});

  // --- API Fetch Effect ---
  useEffect(() => {
    if (!captionData || !captionData.segments) return;

    const fetchBRollResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare the payload from captionData segments
        const payload = captionData.segments.map((seg) => ({
          id: seg.id,
          start: seg.start,
          end: seg.end,
          text: seg.text,
        }));

        const response = await fetch("http://127.0.0.1:8000/cool-captions-broll-results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch B-Roll data: ${response.statusText}`);
        }

        const data: BRollApiResponse[] = await response.json();
        setBRollResults(data);

        // Initialize all selected video indices to 0
        const initialIndices: Record<number, number> = {};
        data.forEach((item) => {
          initialIndices[item.b_roll_id] = 0;
        });
        setSelectedVideoIndices(initialIndices);
        
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchBRollResults();
  }, [captionData]);

  // --- Fallback handling ---
  if (!captionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <p className="text-red-500 font-medium mb-6">No caption configurations found.</p>
          <button
            onClick={() => navigate("/cool-captions/transcribe")}
            className="w-full px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition duration-200"
          >
            Upload Video
          </button>
        </div>
      </div>
    );
  }

  // --- Logic handlers ---
  const handleNextVideo = (bRollId: number, totalVideos: number) => {
    setSelectedVideoIndices((prev) => {
      const currentIndex = prev[bRollId] ?? 0;
      // Loop back to 0 if we reach the end of the array
      const nextIndex = (currentIndex + 1) % totalVideos;
      return {
        ...prev,
        [bRollId]: nextIndex,
      };
    });
  };

  const handleDone = () => {
    // Map selections into required final shape
    const bRollData: FinalBRollData[] = bRollResults.map((item) => {
      const selectedIndex = selectedVideoIndices[item.b_roll_id] || 0;
      const currentVideo = item.results[selectedIndex];

      return {
        b_roll_id: item.b_roll_id,
        query: item.query,
        start: item.start,
        end: item.end,
        duration: currentVideo?.duration || 0,
        url: currentVideo?.url || "",
        download_link: currentVideo?.download_link || "",
        width: currentVideo?.width || 0,
        height: currentVideo?.height || 0,
      };
    });

    // Navigate to the render pipeline page
    navigate("/cool-captions/render", {
      state: { captionData, emojiData, bRollData },
    });
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-gray-50 px-4 max-w-5xl mx-auto pb-16">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header element */}
          <div className="border-b border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">B-Roll Video Selection</h1>
              <p className="text-sm text-gray-500 mt-1">
                Review and cycle through alternative B-Roll context clips matched to your sequence.
              </p>
            </div>
            {!loading && !error && bRollResults.length > 0 && (
              <button
                onClick={handleDone}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm self-start sm:self-center"
              >
                Done
              </button>
            )}
          </div>

          {/* Body contents */}
          <div className="p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Finding matching context B-Roll clips...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex flex-col items-center gap-3">
                <p className="font-medium">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 text-sm font-medium"
                >
                  Retry Request
                </button>
              </div>
            )}

            {!loading && !error && bRollResults.length === 0 && (
              <p className="text-gray-500 text-center py-12">No B-Roll suggestions generated for your segments.</p>
            )}

            {!loading && !error && bRollResults.length > 0 && (
              <div className="space-y-4">
                {bRollResults.map((item) => {
                  const currentIdx = selectedVideoIndices[item.b_roll_id] ?? 0;
                  const currentVideo = item.results?.[currentIdx];
                  const hasVideos = item.results && item.results.length > 0;

                  return (
                    <div 
                      key={item.b_roll_id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 bg-gray-50/50 rounded-xl p-5 gap-4 hover:border-gray-200 transition-colors"
                    >
                      {/* Query Details */}
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
                          {item.query}
                        </span>
                        <div className="text-xs text-gray-400">
                          Timeline: <span className="font-medium text-gray-600">{item.start}s</span> - <span className="font-medium text-gray-600">{item.end}s</span>
                        </div>
                      </div>

                      {/* Video Reference Link & Loop Control */}
                      {hasVideos && currentVideo ? (
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <a 
                            href={currentVideo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-xs sm:max-w-md"
                          >
                            View Option #{currentIdx + 1} ({currentVideo.width}x{currentVideo.height})
                          </a>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {currentIdx + 1} / {item.results.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleNextVideo(item.b_roll_id, item.results.length)}
                              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                            >
                              Change Video
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No alternative video choices found</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}