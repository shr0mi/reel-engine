import React, { useState, useRef } from "react";
import { Loader2, Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { Menu, X, Captions , Film ,Megaphone,Laugh} from "lucide-react";

interface MemeOutput {
    selected_template: string | null;
    top_text: string;
    bottom_text: string;
    image_url: string; // "user_upload" | actual URL
    image_source: "user_upload" | "template_database";
}

function drawMemeText(
    ctx: CanvasRenderingContext2D,
    text: string,
    canvasWidth: number,
    canvasHeight: number,
    position: "top" | "bottom"
) {
    const upper = text.toUpperCase();
    const maxWidth = canvasWidth * 0.9;
    const paddingY = canvasHeight * 0.03;
 
    // Start with font size relative to canvas width, shrink until it fits in 3 lines
    let fontSize = Math.floor(canvasWidth * 0.07);
    const minFontSize = Math.floor(canvasWidth * 0.03);
 
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
 
    let lines: string[] = [];
 
    while (fontSize >= minFontSize) {
        ctx.font = `900 ${fontSize}px Impact, Arial Narrow, sans-serif`;
        lines = wrapText(ctx, upper, maxWidth);
        if (lines.length <= 3) break;
        fontSize -= 2;
    }
 
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const x = canvasWidth / 2;
 
    let startY: number;
    if (position === "top") {
        startY = paddingY + fontSize; // baseline of first line
    } else {
        startY = canvasHeight - paddingY - totalTextHeight + fontSize; // baseline of first bottom line
    }
 
    ctx.lineWidth = fontSize * 0.12;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
 
    lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
    });
}
 
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
 
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

export default function GenerateMeme() {
    const [topicPrompt, setTopicPrompt] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [localImageBlobUrl, setLocalImageBlobUrl] = useState<string | null>(null); // Fixed Variable Name
    const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [memeData, setMemeData] = useState<MemeOutput | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const features = [
    {
        id: "cool-captions",
        name: "CoolCaptions",
        slug: "/cool-captions/transcribe",
        icon: Captions,
    },
    {
        id: "text-2-reel",
        name: "Text2Reel",
        slug: "/text-to-reel",
        icon: Film,
    },
    {
        id: "product-ads",
        name: "ProductAds",
        slug: "/product-ads",
        icon: Megaphone,
    },
    {
        id: "mister-memer",
        name: "Mister_Memer",
        slug: "/mister-memer/generate",
        icon: Laugh,
    },
    ];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setErrorMessage("Please select a valid image file.");
            setStatus("error");
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
        setStatus("idle");
        setErrorMessage("");
    };

    const handleGenerateMeme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topicPrompt.trim()) {
            setErrorMessage("Please enter a topic prompt.");
            setStatus("error");
            return;
        }
        setStatus("generating");
        setErrorMessage("");
        setLocalImageBlobUrl(null); 

        const formData = new FormData();
        formData.append("topic_prompt", topicPrompt);
        if (imageFile) formData.append("image_file", imageFile);

        try {
            const response = await fetch("http://127.0.0.1:8000/generate-meme", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                const data: MemeOutput = await response.json();
                setMemeData(data);

                if (data.image_source === "template_database" && data.image_url) {
                    try {
                        const imgResponse = await fetch(data.image_url);
                        const blob = await imgResponse.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        setLocalImageBlobUrl(blobUrl);
                    } catch (blobError) {
                        console.error("Failed to convert image to blob for CORS bypass:", blobError);
                        setLocalImageBlobUrl(data.image_url);
                    }
                }
                
                setStatus("success");
            } else {
                const err = await response.json().catch(() => ({}));
                setErrorMessage(err.detail || `Generation failed: ${response.status}`);
                setStatus("error");
            }
        } catch {
            setErrorMessage("Network error. Please check your backend connection.");
            setStatus("error");
        }
    };

    const displayImageSrc =
        memeData?.image_source === "user_upload"
            ? (previewUrl ?? "")
            : (localImageBlobUrl ?? memeData?.image_url ?? "");

    const downloadMeme = async () => {
        if (!memeData || isDownloading) return;
        setIsDownloading(true);

        try {
            const img = new Image();
            if (!displayImageSrc.startsWith("blob:") && !displayImageSrc.startsWith("data:")) {
                img.crossOrigin = "anonymous";
            }
            img.src = displayImageSrc;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("Image failed to load"));
            });

            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;

            ctx.drawImage(img, 0, 0);

            drawMemeText(ctx, memeData.top_text, canvas.width, canvas.height, "top");
            drawMemeText(ctx, memeData.bottom_text, canvas.width, canvas.height, "bottom");

            const link = document.createElement("a");
            link.download = `meme_${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();

        } catch (err) {
            console.error("Download failed:", err);
            alert("Download failed. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };
    const resetForm = () => {
        if (localImageBlobUrl) {
            URL.revokeObjectURL(localImageBlobUrl);
        }
        setTopicPrompt("");
        setImageFile(null);
        setPreviewUrl(null);
        setLocalImageBlobUrl(null); // Fixed Variable Name
        setStatus("idle");
        setErrorMessage("");
        setMemeData(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
  <div className="min-h-screen bg-white text-slate-900">

    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-zinc-900"
        >
          AutoReel<span className="text-zinc-500">Engine</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {features.map((feature) => (
            <Link
              key={feature.id}
              to={feature.slug}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {feature.name}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-zinc-600 hover:text-zinc-900"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

      </div>

      {isMobileMenuOpen && (
        <nav className="md:hidden border-b border-zinc-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-sm">
          {features.map((feature) => (
            <Link
              key={feature.id}
              to={feature.slug}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            >
              {feature.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
            
            <div className="max-w-4xl mx-auto px-4 py-8 pt-24">

                {/* Header */}
                <div className="space-y-1 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Generate Meme</h1>
                    <p className="text-sm text-slate-500">
                        Create brand-aligned memes with AI-powered captions
                    </p>
                </div>

                {status === "success" && memeData ? (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Generated Meme</h2>

                            {/* Meme with overlay text */}
                            <div className="flex justify-center bg-slate-50 rounded-lg p-4">
                                <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", minWidth: "600px" }}>
                                    <img
                                        src={displayImageSrc}
                                        alt="Generated Meme"
                                        crossOrigin="anonymous"
                                        style={{
                                            display: "block",
                                            maxWidth: "100%",
                                            minWidth: "600px",
                                            maxHeight: "500px",
                                            borderRadius: "4px",
                                        }}
                                        onError={(e) => {
                                            const t = e.currentTarget;
                                            t.onerror = null;
                                            t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='16'%3EImage failed to load%3C/text%3E%3C/svg%3E";
                                        }}
                                    />

                                    {/* Top text */}
                                    <div style={{
                                        position: "absolute",
                                        top: "12px",
                                        left: 0,
                                        right: 0,
                                        padding: "0 8px",
                                        textAlign: "center",
                                        pointerEvents: "none",
                                    }}>
                                        <span style={{
                                            color: "white",
                                            textTransform: "uppercase",
                                            fontFamily: "Impact, 'Arial Narrow', sans-serif",
                                            fontSize: "clamp(1.2rem, 4vw, 2.2rem)",
                                            fontWeight: "900",
                                            lineHeight: 1.15,
                                            wordBreak: "break-word",
                                            WebkitTextStroke: "2px black",
                                            paintOrder: "stroke fill",
                                            display: "block",
                                        }}>
                                            {memeData.top_text}
                                        </span>
                                    </div>

                                    {/* Bottom text */}
                                    <div style={{
                                        position: "absolute",
                                        bottom: "12px",
                                        left: 0,
                                        right: 0,
                                        padding: "0 8px",
                                        textAlign: "center",
                                        pointerEvents: "none",
                                    }}>
                                        <span style={{
                                            color: "white",
                                            textTransform: "uppercase",
                                            fontFamily: "Impact, 'Arial Narrow', sans-serif",
                                            fontSize: "clamp(1.2rem, 4vw, 2.2rem)",
                                            fontWeight: "900",
                                            lineHeight: 1.15,
                                            wordBreak: "break-word",
                                            WebkitTextStroke: "2px black",
                                            paintOrder: "stroke fill",
                                            display: "block",
                                        }}>
                                            {memeData.bottom_text}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Template label */}
                            {memeData.selected_template && (
                                <p className="text-xs text-slate-400 mt-2 text-center">
                                    Template: {memeData.selected_template.replace(/_/g, " ")}
                                </p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={downloadMeme}
                                    disabled={isDownloading}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-100 bg-slate-900 hover:bg-slate-700 disabled:opacity-60 disabled:pointer-events-none transition-colors shadow-sm"
                                >
                                    {isDownloading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Downloading...</>
                                    ) : (
                                        <><Download className="w-4 h-4" />Download Meme</>
                                    )}
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Generate Another
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <form onSubmit={handleGenerateMeme} className="space-y-6">

                            {/* Topic Prompt */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Topic Prompt <span className="text-slate-500">*</span>
                                </label>
                                <textarea
                                    value={topicPrompt}
                                    onChange={(e) => setTopicPrompt(e.target.value)}
                                    placeholder="e.g., Late night hunger hitting again after dinner..."
                                    className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-y transition-all"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Image <span className="text-slate-400 font-normal">(optional — uses template if omitted)</span>
                                </label>
                                {!previewUrl ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 hover:border-slate-400 transition-colors rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <ImageIcon className="h-8 w-8 text-slate-400" />
                                        <p className="text-sm font-medium text-slate-700">Click to upload</p>
                                        <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center max-h-48">
                                            <img src={previewUrl} alt="Preview" className="max-w-full max-h-48 object-contain" />
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <p className="text-xs text-slate-600 flex-1 truncate">{imageFile?.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setPreviewUrl(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shrink-0"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {status === "error" && errorMessage && (
                                <div className="rounded-lg bg-slate-100 border border-slate-200 p-3">
                                    <p className="text-sm text-slate-700">{errorMessage}</p>
                                </div>
                            )}

                            {/* Loading */}
                            {status === "generating" && (
                                <div className="rounded-lg bg-slate-100 border border-slate-200 p-4 flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 text-slate-700 animate-spin" />
                                    <p className="text-sm text-slate-700 font-medium">Generating your meme...</p>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={status === "generating" || !topicPrompt.trim()}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-900 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                                >
                                    {status === "generating" ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                                    ) : "Generate Meme"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}