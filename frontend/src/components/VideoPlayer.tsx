import {useEffect, useState, useRef} from "react";

// Types matching your FastAPI JSON structure
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
  positionY: number; // Represents percentage from top (e.g. 75)
}

interface CaptionPayload {
  videoUrl: string;
  globalStyles: GlobalStyles;
  segments: CaptionSegment[];
}

export default function VideoPlayer() {
    // Get the video from server
    const videoUrl = "http://127.0.0.1:8000/api/video";
    const videoRef = useRef<HTMLVideoElement>(null);

    // 1. Core states for storing server payload and tracking active caption text
    const [captionData, setCaptionData] = useState<CaptionPayload | null>(null);
    const [currentText, setCurrentText] = useState<string>("");

    // 2. Fetch the caption configuration configuration from FastAPI on mount
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/captions")
        .then((res) => {
            if (!res.ok) throw new Error("Failed to pull caption tracks");
            return res.json();
        })
        .then((data: CaptionPayload) => {
            setCaptionData(data);
        })
        .catch((err) => console.error("Error fetching captions:", err));
    }, []);

    // 3. Time tracking sync handle triggered on every video tick
    const handleTimeUpdate = () => {
        if (!videoRef.current || !captionData) return;

        const currentTime = videoRef.current.currentTime;

        // Search for a matching segment active right now
        const activeSegment = captionData.segments.find(
        (seg) => currentTime >= seg.start && currentTime <= seg.end
        );

        // Update text string if a match is found, otherwise clear the layer
        setCurrentText(activeSegment ? activeSegment.text : "");
    };

    if (!captionData) {
        return <div className="text-sm text-gray-500 animate-pulse">Loading setup assets...</div>;
    }

    const { globalStyles } = captionData;

    return (
    <div className="max-w-[400px]">
      {/* 
        The parent container MUST be relative. 
        This keeps the caption element bounded inside the video dimensions.
      */}
      <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
        
        {/* HTML5 Video Source Engine */}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          muted
          width="100%"
          onTimeUpdate={handleTimeUpdate}
          className="block w-full"
        >
          Your browser does not support the video tag.
        </video>

        {/* 
          Caption Layer Engine:
          Positions text dynamically using globalStyles values coming straight out of state.
        */}
        {currentText && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[90%] text-center pointer-events-none select-none transition-all duration-75"
            style={{
              top: `${globalStyles.positionY}%`,
              fontFamily: globalStyles.fontFamily,
              fontSize: `${globalStyles.fontSize}px`,
              color: globalStyles.primaryColor,
              fontWeight: "black",
              textTransform: "uppercase",
              // Simulating standard TikTok text stroke using CSS text-shadow
              textShadow: `
                -${globalStyles.strokeWidth}px -${globalStyles.strokeWidth}px 0 ${globalStyles.strokeColor},  
                 ${globalStyles.strokeWidth}px -${globalStyles.strokeWidth}px 0 ${globalStyles.strokeColor},
                -${globalStyles.strokeWidth}px  ${globalStyles.strokeWidth}px 0 ${globalStyles.strokeColor},
                 ${globalStyles.strokeWidth}px  ${globalStyles.strokeWidth}px 0 ${globalStyles.strokeColor}
              `,
            }}
          >
            {currentText}
          </div>
        )}
      </div>
    </div>
  );
}