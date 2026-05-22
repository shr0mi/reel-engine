import { useLocation, useNavigate } from "react-router";

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

export default function RenderPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract and type-cast the state safely
    const captionData = location.state as CaptionPayload | null;

    // Fallback guard: If someone types /render directly into the URL bar, 
    // there won't be any state. Redirect them back.
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

    return (
        <>
            <h1>Render Page</h1>
        </>
    )
}