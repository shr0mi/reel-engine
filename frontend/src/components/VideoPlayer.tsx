import {useEffect, useState, useRef} from "react";
import { Slider } from "@/components/ui/slider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import { useNavigate } from 'react-router';

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
    const navigate = useNavigate();

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

    const handleRender = () => {
      if(!captionData) {
        alert("No Caption Data Found");
        return;
      }

      // Navigate to render page with captionData as state
      navigate("/render", { state: { captionData } });

    }

    const { globalStyles } = captionData;

    return (
      <div className="flex gap-[20px]" items-start>
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
                //WebkitTextStroke: '3px black',
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
          <div className="flex flex-col gap-[20px]">
            {/* Caption Position Control */}
            <Card>
              <CardHeader>
                <CardTitle>Caption Position</CardTitle>
              </CardHeader>
              <CardContent>
                <Slider
                // Use value instead of defaultValue so it stays in sync with your state
                value={[captionData?.globalStyles.positionY ?? 75]} 
                max={100}
                step={1}
                className="w-[200px]"
                onValueChange={(values) => {
                  // Grab the first value from the array
                  const newY = values[0]; 
                  
                  setCaptionData((prev) => {
                    // If there's no data yet, just return null
                    if (!prev) return null; 
                    
                    return {
                      ...prev,
                      globalStyles: {
                        ...prev.globalStyles,
                        positionY: newY, // Update just the positionY
                      },
                    };
                  });
                }}
              />
              </CardContent>
            </Card>

            {/* Control Font Size */}
            <Card>
              <CardHeader>
                <CardTitle>Caption Font Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Slider
                // Use value instead of defaultValue so it stays in sync with your state
                value={[captionData?.globalStyles.fontSize ?? 40]} 
                max={50}
                step={1}
                className="w-[200px]"
                onValueChange={(values) => {
                  // Grab the first value from the array
                  const newFontSize = values[0]; 
                  
                  setCaptionData((prev) => {
                    // If there's no data yet, just return null
                    if (!prev) return null; 
                    
                    return {
                      ...prev,
                      globalStyles: {
                        ...prev.globalStyles,
                        fontSize: newFontSize, // Update just the fontSize
                      },
                    };
                  });
                }}
              />
              </CardContent>
            </Card>

            {/* Caption Font Color */}
            <Card>
              <CardHeader>
                <CardTitle>Caption Font Color</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={captionData?.globalStyles.primaryColor ?? "#ffffff"}
                    onChange={(e) => {
                      setCaptionData((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          globalStyles: {
                            ...prev.globalStyles,
                            primaryColor: e.target.value,
                          },
                        };
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <Button className="hover:bg-white hover:text-black border-2 border-black"
              onClick={handleRender}
            >
              Render Video
            </Button>
          
          </div>
      </div>
  );
}