import React, { useState, useRef } from "react";
import { useNavigate } from 'react-router';
import { Upload, CheckCircle2, AlertCircle, Loader2, Video } from "lucide-react";

export default function TranscribeVideoPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        
        // Basic client-side validation
        if (!selectedFile.type.startsWith("video/")) {
            setErrorMessage("Please select a valid video file.");
            setStatus("error");
            return;
        }
        console.log(selectedFile);
        setFile(selectedFile);
        setStatus("idle");
        setErrorMessage("");
        }
    };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Direct fetch call - stays in 'uploading' state until response arrives
      const response = await fetch("http://127.0.0.1:8000/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setStatus("success");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.detail || `Upload failed with status: ${response.status}`);
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage("A network error occurred. Please check your backend connection.");
      setStatus("error");
    }
  };

  const resetForm = () => {
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[80vh] p-4">
      <div className="w-full max-w-md bg-card text-card-foreground border rounded-xl shadow-sm p-6">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-bold text-2xl tracking-tight">Transcribe Video</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your video file to generate a transcription
          </p>
        </div>

        {/* Form States */}
        {status === "idle" && (
          <form onSubmit={handleUpload} className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-muted/40"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden" 
              />
              {file ? (
                <>
                  <Video className="h-10 w-10 text-primary animate-pulse" />
                  <p className="text-sm font-medium text-center max-w-[250px] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">Video formats up to 500MB</p>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={!file}
              className="w-full h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-md font-medium text-sm transition-colors shadow"
            >
              Upload and Process
            </button>
          </form>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium animate-pulse">Uploading and processing video...</p>
              <p className="text-xs text-muted-foreground mt-1">Please keep this window open</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <div>
              <p className="text-md font-semibold text-emerald-600 dark:text-emerald-400">
                Upload Complete!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your video is successfully uploaded and transcription has started.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="mt-2 h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
            >
              Upload Another Video
            </button>
            <button
              onClick={() => {navigate('/cool-captions/caption')}}
              className="h-9 px-4 py-2 border border-input bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Generate Captions
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="text-md font-semibold text-destructive">Something went wrong</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={resetForm}
              className="mt-2 h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}