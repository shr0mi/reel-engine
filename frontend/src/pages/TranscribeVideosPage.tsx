import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

type Status = "idle" | "uploading" | "success" | "error";

export default function TranscribeVideoPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const styleId = "transcribe-animations";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(40px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes pulseRing {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.2); }
        50%       { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
      }
      @keyframes popIn {
        from { transform: scale(0.7); opacity: 0; }
        to   { transform: scale(1); opacity: 1; }
      }
      @keyframes waveAnim {
        0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
        50%       { transform: scaleY(1);   opacity: 1; }
      }
      @keyframes progressSlide {
        0%   { width: 15%; }
        60%  { width: 85%; }
        100% { width: 92%; }
      }
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes successPop {
        from { transform: scale(0); opacity: 0; }
        to   { transform: scale(1); opacity: 1; }
      }
      @keyframes confettiFall {
        from { transform: translateY(-20px); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }
      @keyframes shake {
        0%, 100% { transform: rotate(0); }
        20%      { transform: rotate(-6deg); }
        40%      { transform: rotate(6deg); }
        60%      { transform: rotate(-4deg); }
        80%      { transform: rotate(4deg); }
      }

      .tv-drop-zone:hover .tv-upload-icon-wrap {
        transform: translateY(-4px) rotate(-4deg) !important;
      }
      .tv-drop-zone:hover {
        border-color: #818cf8 !important;
        transform: scale(1.01);
      }
      .tv-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(99,102,241,0.38) !important;
      }
      .tv-btn-primary:active { transform: translateY(0); }
      .tv-btn-secondary:hover {
        background: #f5f3ff !important;
        border-color: #818cf8 !important;
        transform: translateY(-1px);
      }
      .tv-btn-success:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(16,185,129,0.38) !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleFileSelect = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setErrorMessage("Please select a valid video file.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/transcribe/", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setStatus("success");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(
          errorData.detail || `Upload failed with status: ${response.status}`,
        );
        setStatus("error");
      }
    } catch {
      setErrorMessage(
        "A network error occurred. Please check your backend connection.",
      );
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  type StepState = "active" | "done" | "idle";
  const stepConfig: Record<Status, [StepState, StepState, StepState]> = {
    idle: ["active", "idle", "idle"],
    uploading: ["done", "active", "idle"],
    success: ["done", "done", "active"],
    error: ["done", "idle", "idle"],
  };
  const stepStates = stepConfig[status];
  const line1Done = status === "uploading" || status === "success";
  const line2Done = status === "success";

  const stepDotStyle = (state: StepState): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.4s ease",
    ...(state === "active" && {
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      color: "white",
      boxShadow: "0 2px 10px rgba(99,102,241,0.3)",
    }),
    ...(state === "done" && { background: "#d1fae5", color: "#059669" }),
    ...(state === "idle" && { background: "#f3f4f6", color: "#9ca3af" }),
  });

  const waveHeights = [18, 32, 44, 32, 18, 30, 44, 30, 18];
  const mb = file ? (file.size / 1024 / 1024).toFixed(2) : "0";
  const fileName = file
    ? file.name.length > 28
      ? file.name.slice(0, 25) + "…"
      : file.name
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'DM Sans', sans-serif",
        background: "#ffffff",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 28,
          padding: "2.5rem 2rem",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          animation: "slideUp 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #e0e7ff, #f5d0fe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              animation: "pulseRing 3s ease-in-out infinite",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#1e1b4b",
              letterSpacing: "-0.4px",
              margin: 0,
            }}
          >
            Transcribe Video
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              marginTop: 4,
              fontWeight: 300,
            }}
          >
            Upload a video and we'll turn it into text
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.75rem",
          }}
        >
          {[1, 2, 3].map((n, i) => (
            <React.Fragment key={n}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div style={stepDotStyle(stepStates[i])}>
                  {stepStates[i] === "done" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    n
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    color: stepStates[i] === "active" ? "#6366f1" : "#9ca3af",
                    fontWeight: stepStates[i] === "active" ? 500 : 400,
                  }}
                >
                  {["Upload", "Process", "Done"][i]}
                </span>
              </div>
              {i < 2 && (
                <div
                  style={{
                    width: 40,
                    height: 2,
                    background: [line1Done, line2Done][i]
                      ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                      : "#e5e7eb",
                    marginBottom: 16,
                    transition: "background 0.4s",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── IDLE ── */}
        {status === "idle" && (
          <div>
            <div
              ref={dropZoneRef}
              className="tv-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? "#818cf8" : file ? "#a78bfa" : "#c7d2fe"}`,
                borderStyle: file ? "solid" : "dashed",
                borderRadius: 18,
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                cursor: "pointer",
                background: file ? "#faf5ff" : "#f9f8ff",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                transform: isDragging ? "scale(1.02)" : undefined,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={handleInputChange}
              />

              <div
                className="tv-upload-icon-wrap"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "white",
                  border: "1px solid #e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.12)",
                  transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                </svg>
              </div>

              <div style={{ fontSize: 14, fontWeight: 500, color: "#4338ca" }}>
                {file ? "File selected" : "Click to upload or drag & drop"}
              </div>
              {!file && (
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  Video files up to 500 MB
                </div>
              )}

              {file && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "white",
                    border: "1px solid #e0e7ff",
                    borderRadius: 50,
                    padding: "6px 14px",
                    marginTop: 12,
                    fontSize: 13,
                    color: "#4338ca",
                    fontWeight: 500,
                    animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.1)",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                  {fileName} · {mb} MB
                </div>
              )}
            </div>

            <button
              className="tv-btn-primary"
              disabled={!file}
              onClick={handleUpload}
              style={{
                width: "100%",
                height: 48,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontFamily: "'Sora', sans-serif",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                marginTop: "1rem",
                boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                letterSpacing: "-0.2px",
                transition: "all 0.25s ease",
                opacity: !file ? 0.45 : 1,
                pointerEvents: !file ? "none" : "auto",
              }}
            >
              Upload &amp; Process
            </button>
          </div>
        )}

        {/* ── UPLOADING ── */}
        {status === "uploading" && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                height: 48,
                marginBottom: "1.5rem",
              }}
            >
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: h,
                    borderRadius: 10,
                    background: "linear-gradient(to top, #c7d2fe, #6366f1)",
                    animation: `waveAnim 1.2s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                height: 6,
                background: "#e0e7ff",
                borderRadius: 10,
                overflow: "hidden",
                margin: "1rem 0",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background:
                    "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
                  backgroundSize: "200% 100%",
                  borderRadius: 10,
                  animation:
                    "progressSlide 2.5s ease-in-out forwards, shimmer 1.8s linear infinite",
                }}
              />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#4338ca" }}>
              Processing your video…
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              Please keep this window open
            </p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === "success" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                marginBottom: "1rem",
              }}
            >
              {["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"].map(
                (c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c,
                      animation: `confettiFall 1s ease-out ${i * 0.05 + 0.05}s both`,
                    }}
                  />
                ),
              )}
            </div>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                animation:
                  "successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                boxShadow: "0 4px 24px rgba(16,185,129,0.22)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 19,
                fontWeight: 600,
                color: "#065f46",
              }}
            >
              Transcription complete!
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              Your video has been uploaded and transcription is ready to go.
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                marginTop: "1.5rem",
              }}
            >
              <button
                className="tv-btn-secondary"
                onClick={reset}
                style={{
                  height: 42,
                  padding: "0 20px",
                  background: "white",
                  color: "#4338ca",
                  border: "1.5px solid #c7d2fe",
                  borderRadius: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                }}
              >
                Upload another
              </button>
              <button
                className="tv-btn-success"
                onClick={() => navigate("/cool-captions/caption")}
                style={{
                  height: 42,
                  padding: "0 20px",
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.28)",
                  transition: "all 0.22s ease",
                }}
              >
                Generate Captions
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                animation: "shake 0.5s ease both",
                boxShadow: "0 4px 24px rgba(239,68,68,0.18)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#991b1b",
              }}
            >
              Something went wrong
            </p>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {errorMessage}
            </p>
            <button
              className="tv-btn-primary"
              onClick={reset}
              style={{
                width: "100%",
                height: 48,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontFamily: "'Sora', sans-serif",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                marginTop: "1.25rem",
                boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                transition: "all 0.25s ease",
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
