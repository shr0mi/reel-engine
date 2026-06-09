import {useEffect, useState, useRef} from "react";
import { Slider } from "@/components/ui/slider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import { useNavigate } from 'react-router';
import {Loader2} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

// Define some common, clean fonts
const AVAILABLE_FONTS = [
  { name: "Impact", value: "font-impact" }, // You'll define these utility classes below
  { name: "Arial", value: "font-sans" },
  { name: "Helvetica", value: "font-helvetica" },
  { name: "Comic Sans", value: "font-comic" },
  { name: "Times New Roman", value: "font-serif" },
  { name: "Courier New", value: "font-mono" },
];

export default function VideoPlayer() {
    const navigate = useNavigate();

    // Get the video from server
    const videoUrl = "http://127.0.0.1:8000/api/video";
    const videoRef = useRef<HTMLVideoElement>(null);

    // 1. Core states for storing server payload and tracking active caption text
    const [captionData, setCaptionData] = useState<CaptionPayload | null>(null);
    const [emojiData, setEmojiData] = useState<EmojiPayload | null>(null);
    const [currentText, setCurrentText] = useState<string>("");
    const [currentEmoji, setCurrentEmoji] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingText, setLoadingText] = useState<string>("Loading caption configuration...");

// 2. Fetch the caption configuration and emojis sequentially on mount
useEffect(() => {
    setIsLoading(true);
    setLoadingText("Loading caption configuration...");
    
    fetch("http://127.0.0.1:8000/api/captions")
    .then((res) => {
        if (!res.ok) throw new Error("Failed to pull caption tracks");
        return res.json();
    })
    .then((data: CaptionPayload) => {
        // 1. Save the caption data to state for your UI
        setCaptionData(data);

        // 2. Guard: Make sure the response actually has segments
        if (!data.segments || data.segments.length === 0) {
            console.log("No caption segments found, skipping AI emoji fetch.");
            setIsLoading(false); 
            return;
        }

        // 3. Immediately kick off the second fetch using 'data.segments' directly!
        setLoadingText("Applying AI emoji magic to your captions...");
        console.log("Sending segments to Pydantic AI agent for emoji magic...");

        // Return this fetch promise so we can chain the next .then()
        return fetch("http://127.0.0.1:8000/cool-captions-agent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data.segments), 
        });
    })
    .then((res) => {
        // If the previous block bailed out early, res will be undefined
        if (!res) return; 
        
        if (!res.ok) throw new Error("Failed to fetch AI emoji recommendations");
        return res.json();
    })
    .then((payload: { status: string; data: { emojis: EmojiSegment[] }; globalStyles: EmojiGlobalStyles }) => {
        if (!payload) return;

        // 4. Save emoji data and turn off the loader
        setEmojiData({
            status: payload.status,
            data: payload.data.emojis,
            globalStyles: payload.globalStyles
        });
        console.log("Successfully applied AI emojis:", payload.data.emojis);
        setIsLoading(false); 
    })
    .catch((err) => {
        console.error("Error in fetching pipeline:", err);
        setIsLoading(false);
    });
}, []); // Empty dependency array keeps it running strictly once on mount.
    

    // 3. Time tracking sync handle triggered on every video tick
    const handleTimeUpdate = () => {
        if (!videoRef.current || !captionData) return;

        const currentTime = videoRef.current.currentTime;

        // Search for a matching segment active right now
        const activeSegment = captionData.segments.find(
        (seg) => currentTime >= seg.start && currentTime <= seg.end
        );

        // Find Emoji Segment
        const activeEmojiSegment = emojiData?.data.find(
            (seg) => currentTime >= seg.start && currentTime <= seg.end
        );

        // Update text string if a match is found, otherwise clear the layer
        setCurrentText(activeSegment ? activeSegment.text : "");
        setCurrentEmoji(activeEmojiSegment ? activeEmojiSegment.emoji : "");
    };

    if (!captionData) {
        return <div className="text-sm text-gray-500 animate-pulse">Loading setup assets...</div>;
    }

    const handleRender = () => {
      if(!captionData) {
        alert("No Caption Data Found");
        return;
      }
 
      // Navigate to b-roll page with captionData and emojiData as state
      navigate("/cool-captions/b-roll", { state: { captionData, emojiData } });

    }

    const { globalStyles } = captionData;

    if(isLoading){
      return(
        <div className="flex flex-col items-center justify-center min-h-[200px] w-full gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="animate-pulse">{loadingText}</span>
        </div>
      )
    }

    return (
      <div className="flex gap-[20px]">
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
            className={`absolute left-1/2 -translate-x-1/2 w-[90%] text-center pointer-events-none select-none transition-all duration-75
              ${captionData.globalStyles.fontFamily ?? "font-impact"}
              `}
            style={{
              top: `${globalStyles.positionY}%`,
              fontSize: `${globalStyles.fontSize}px`,
              color: globalStyles.primaryColor,
              fontWeight: "300", // "black" isn't standard CSS; use "900" or "bold"
              textTransform: "uppercase",
              letterSpacing: "1.5px", // Adds that cinematic title spacing
              textShadow: `
                /* 1. Sharp core glow to keep letters crisp */
                0 0 4px ${globalStyles.primaryColor},
                
                /* 3. Wide, soft background glow (simulating light bleed) */
                0 0 24px ${globalStyles.primaryColor},

                /* NEW: Tight black shadow sticking directly to the letters */
                0px 0px ${globalStyles.fontSize/5}px rgba(0, 0, 0, 0.95),
                
                /* 4. Deep, soft drop shadow to push the text off the background */
                2px 4px 8px rgba(0, 0, 0, 0.9),
                4px 8px 16px rgba(0, 0, 0, 0.6)
              `,
            }}
          >
            {currentText}
          </div>
          )}
          {currentEmoji && (
            <div
              className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none select-none transition-all duration-75 rounded-lg px-3 py-1"
              style={{
                top: `${emojiData?.globalStyles.positionY}%`,
                fontFamily: globalStyles.fontFamily,
                fontSize: `${emojiData?.globalStyles.fontSize}px`,
                backgroundColor: emojiData?.globalStyles.backgroundColor,
              }}
            >
              {currentEmoji}
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

            {/* Caption Font Family */}
            <Card>
              <CardHeader>
                <CardTitle>Caption Font Family</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  // Fallback to 'font-impact' if no font is set yet
                  value={captionData?.globalStyles.fontFamily ?? "font-impact"}
                  onValueChange={(newFont) => {
                    setCaptionData((prev) => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        globalStyles: {
                          ...prev.globalStyles,
                          fontFamily: newFont, // Update the font family
                        },
                      };
                    }
                  ); //console.log(captionData?.globalStyles.fontFamily);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {/* Visual preview of the font in the dropdown */}
                        <span className={font.value}>{font.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            
            {/* Emoji Position Control */}
            <Card>
              <CardHeader>
                <CardTitle>Emoji Position</CardTitle>
              </CardHeader>
              <CardContent>
                <Slider
                // Use value instead of defaultValue so it stays in sync with your state
                value={[emojiData?.globalStyles.positionY ?? 55]} 
                max={100}
                step={1}
                className="w-[200px]"
                onValueChange={(values) => {
                  // Grab the first value from the array
                  const newY = values[0]; 
                  
                  setEmojiData((prev) => {
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

            {/* Emoji Font Size */}
            <Card>
              <CardHeader>
                <CardTitle>Emoji Font Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Slider
                // Use value instead of defaultValue so it stays in sync with your state
                value={[emojiData?.globalStyles.fontSize ?? 40]} 
                max={80}
                step={1}
                className="w-[200px]"
                onValueChange={(values) => {
                  // Grab the first value from the array
                  const newFontSize = values[0]; 
                  
                  setEmojiData((prev) => {
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

            {/* Go to Next page button */}
            <Button className="hover:bg-white hover:text-black border-2 border-black"
              onClick={handleRender}
            >
              Render Video
            </Button>
          
          </div>
      </div>
  );
}