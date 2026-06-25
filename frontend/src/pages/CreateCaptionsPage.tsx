import VideoPlayer from "@/components/VideoPlayer";
import Navbar from "@/components/Navbar";

export default function CreateCaptionsPage() {
    return (
        <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <div className="flex w-full justify-center px-4 pt-24 pb-12">
                <VideoPlayer />
            </div>
        </div>
    );
}