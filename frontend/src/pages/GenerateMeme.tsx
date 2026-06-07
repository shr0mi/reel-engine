import React, { useState, useRef, useCallback } from "react";
import {
  Loader2,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Laugh,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemeOutput {
  selected_template: string | null;
  top_text: string;
  bottom_text: string;
  image_url: string;
  image_source: "user_upload" | "template_database";
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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

function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  position: "top" | "bottom",
) {
  const upper = text.toUpperCase();
  const maxWidth = canvasWidth * 0.9;
  const paddingY = canvasHeight * 0.03;
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
    startY = paddingY + fontSize;
  } else {
    startY = canvasHeight - paddingY - totalTextHeight + fontSize;
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GenerateMeme() {
  const [topicPrompt, setTopicPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localImageBlobUrl, setLocalImageBlobUrl] = useState<string | null>(
    null,
  );
  const [status, setStatus] = useState<
    "idle" | "generating" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [memeData, setMemeData] = useState<MemeOutput | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

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
            const imgRes = await fetch(data.image_url);
            const blob = await imgRes.blob();
            setLocalImageBlobUrl(URL.createObjectURL(blob));
          } catch {
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
      if (
        !displayImageSrc.startsWith("blob:") &&
        !displayImageSrc.startsWith("data:")
      )
        img.crossOrigin = "anonymous";
      img.src = displayImageSrc;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error("Load failed"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      drawMemeText(ctx, memeData.top_text, canvas.width, canvas.height, "top");
      drawMemeText(
        ctx,
        memeData.bottom_text,
        canvas.width,
        canvas.height,
        "bottom",
      );
      const link = document.createElement("a");
      link.download = `meme_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const resetForm = () => {
    if (localImageBlobUrl) URL.revokeObjectURL(localImageBlobUrl);
    setTopicPrompt("");
    setImageFile(null);
    setPreviewUrl(null);
    setLocalImageBlobUrl(null);
    setStatus("idle");
    setErrorMessage("");
    setMemeData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="my-20 min-h-screen  text-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Laugh className="w-5 h-5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
              Mister_Memer
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Generate a Meme
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Describe your idea and let AI craft the perfect caption.
          </p>
        </div>

        {/* ── Success state ─────────────────────────────────────────── */}
        {status === "success" && memeData ? (
          <div className="space-y-4">
            {/* Meme preview card */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="relative bg-zinc-900">
                <div style={{ position: "relative", width: "100%" }}>
                  <img
                    src={displayImageSrc}
                    alt="Generated Meme"
                    crossOrigin="anonymous"
                    style={{
                      display: "block",
                      width: "100%",
                      maxHeight: 480,
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.onerror = null;
                      t.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='16'%3EImage failed to load%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {/* Top text overlay */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      padding: "0 10px",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        textTransform: "uppercase",
                        fontFamily: "Impact, 'Arial Narrow', sans-serif",
                        fontSize: "clamp(1rem, 5vw, 2rem)",
                        fontWeight: 900,
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                        WebkitTextStroke: "2px black",
                        paintOrder: "stroke fill",
                        display: "block",
                      }}
                    >
                      {memeData.top_text}
                    </span>
                  </div>
                  {/* Bottom text overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      padding: "0 10px",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        textTransform: "uppercase",
                        fontFamily: "Impact, 'Arial Narrow', sans-serif",
                        fontSize: "clamp(1rem, 5vw, 2rem)",
                        fontWeight: 900,
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                        WebkitTextStroke: "2px black",
                        paintOrder: "stroke fill",
                        display: "block",
                      }}
                    >
                      {memeData.bottom_text}
                    </span>
                  </div>
                </div>
              </div>

              {memeData.selected_template && (
                <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
                  <p className="text-xs text-zinc-400">
                    Template:{" "}
                    <span className="font-medium text-zinc-500">
                      {memeData.selected_template.replace(/_/g, " ")}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={downloadMeme}
                disabled={isDownloading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Generate Another
              </button>
            </div>
          </div>
        ) : (
          /* ── Form state ─────────────────────────────────────────── */
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <form onSubmit={handleGenerateMeme}>
              {/* Topic prompt */}
              <div className="p-6 space-y-2">
                <label className="block text-sm font-medium text-zinc-700">
                  What's the meme about? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder="e.g., That feeling when the Wi-Fi drops right before submitting an assignment…"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 resize-none transition-all"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-100" />

              {/* Image upload */}
              <div className="p-6 space-y-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Image{" "}
                  <span className="text-zinc-400 font-normal text-xs">
                    (optional — AI picks a template if skipped)
                  </span>
                </label>

                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDragging
                        ? "border-zinc-400 bg-zinc-100"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-700">
                        {isDragging
                          ? "Drop it here"
                          : "Click or drag to upload"}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="bg-zinc-100 flex items-center justify-center max-h-44">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-44 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 bg-white border-t border-zinc-100">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <p className="text-xs text-zinc-500 flex-1 truncate">
                        {imageFile?.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Error / loading feedback */}
              {status === "error" && errorMessage && (
                <div className="mx-6 mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {status === "generating" && (
                <div className="mx-6 mb-4 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-zinc-500 animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      Generating your meme…
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Picking the best template and crafting captions
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="px-6 pb-6 flex justify-end">
                <button
                  type="submit"
                  disabled={status === "generating" || !topicPrompt.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  {status === "generating" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Meme
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
