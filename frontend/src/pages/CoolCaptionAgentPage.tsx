import { useLocation, useNavigate } from "react-router";

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

interface CaptionPayload {
  videoUrl: string;
  globalStyles: GlobalStyles;
  segments: CaptionSegment[];
}

export default function CoolCaptionAgentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const raw = location.state as { captionData: CaptionPayload } | null;
    const captionData = raw?.captionData ?? null;

    // If captionData is missing, prompt user to upload a video first
    if (!captionData) {
    return (
        <div className="p-6 text-center">
            <p className="text-red-500 mb-4">No caption configurations found.</p>
            <button
            onClick={() => navigate("/transcribe")}
            className="px-4 py-2 bg-gray-200 rounded"
            >
            Upload Video
            </button>
        </div>
        );
    }

    


    return(
        <>
            <h1>Cool Caption Agent</h1>
        </>
    );
}