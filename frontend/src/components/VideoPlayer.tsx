export default function VideoPlayer() {
    // Get the video from server
    const videoUrl = "http://127.0.0.1:8000/api/video";

    return(
        <div className="max-w-[400px]">
            <video 
            src={videoUrl} 
            controls 
            autoPlay 
            muted 
            width="100%" 
            style={{ borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    )
}