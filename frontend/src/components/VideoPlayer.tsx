import { useEffect, useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── Types ─────────────────────────────────────────────────── */
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

const AVAILABLE_FONTS = [
  { name: "Impact", value: "font-impact" },
  { name: "Arial", value: "font-sans" },
  { name: "Helvetica", value: "font-helvetica" },
  { name: "Comic Sans", value: "font-comic" },
  { name: "Times New Roman", value: "font-serif" },
  { name: "Courier New", value: "font-mono" },
];

/* ─── Injected CSS ───────────────────────────────────────────── */
const INJECTED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes vp-fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes vp-pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes vp-spin     { to{transform:rotate(360deg)} }
  @keyframes vp-ripple   { 0%{transform:scale(.6);opacity:.8} 100%{transform:scale(2.4);opacity:0} }
  @keyframes vp-barUp    { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
  @keyframes vp-slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes vp-popIn    { from{transform:scale(.85) translateX(-50%);opacity:0} to{transform:scale(1) translateX(-50%);opacity:1} }
  @keyframes vp-glow     { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,.3)} 50%{box-shadow:0 0 40px rgba(99,102,241,.6)} }
  @keyframes vp-shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes vp-gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes vp-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

  .vp-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #ffffff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0 60px 0;
    position: relative;
    overflow-x: hidden;
  }

  /* Subtle ambient orbs */
  .vp-root::before {
    content: '';
    position: fixed;
    top: -200px; left: 50%;
    transform: translateX(-50%);
    width: 800px; height: 500px;
    background: radial-gradient(ellipse, rgba(99,102,241,.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .vp-root::after {
    content: '';
    position: fixed;
    bottom: -100px; right: -100px;
    width: 500px; height: 500px;
    background: radial-gradient(ellipse, rgba(168,85,247,.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }



  /* ── Main layout ── */
  .vp-main {
    width: 100%;
    max-width: 1100px;
    padding: 48px 24px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    position: relative;
    z-index: 1;
  }

  .vp-page-title {
    text-align: center;
    animation: vp-fadeUp .5s ease .1s both;
  }
  .vp-page-title h1 {
    font-size: 32px;
    font-weight: 800;
    color: #1e1b4b;
    letter-spacing: -1px;
    margin: 0 0 8px 0;
    line-height: 1.1;
  }
  .vp-page-title h1 span {
    background: linear-gradient(135deg, #818cf8, #c084fc, #f0abfc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .vp-page-title p {
    font-size: 14px;
    color: #4b5563;
    margin: 0;
    font-weight: 400;
  }

  /* ── Segments badge ── */
  .vp-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 14px;
    background: rgba(99,102,241,.1);
    border: 1px solid rgba(99,102,241,.2);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    letter-spacing: .3px;
  }
  .vp-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #6366f1;
    animation: vp-pulse 2s ease infinite;
  }

  /* ── Content grid ── */
  .vp-content {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 24px;
    width: 100%;
    align-items: start;
    animation: vp-fadeUp .6s ease .2s both;
  }

  /* ── Video card ── */
  .vp-video-card {
    background: #ffffff;
    border: 1px solid #e9e7f8;
    border-radius: 24px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 24px rgba(99,102,241,.06);
  }

  .vp-video-wrap {
    position: relative;
    width: 100%;
    max-width: 380px;
    border-radius: 16px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 0 0 1px #e9e7f8, 0 16px 48px rgba(0,0,0,.18);
  }

  .vp-video-wrap video {
    display: block;
    width: 100%;
  }

  .vp-caption-overlay {
    position: absolute;
    left: 4%;
    right: 4%;
    text-align: center;
    pointer-events: none;
    user-select: none;
    animation: vp-slideIn .1s ease both;
    word-break: break-word;
    white-space: normal;
    line-height: 1.15;
  }

  .vp-emoji-overlay {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    pointer-events: none;
    user-select: none;
    border-radius: 12px;
    padding: 4px 14px;
    animation: vp-popIn .12s ease both;
  }

  /* ── Sidebar ── */
  .vp-sidebar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: sticky;
    top: 24px;
  }

  .vp-sidebar-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #4b5563;
    padding: 0 4px;
    margin-bottom: 2px;
  }

  /* ── Control card ── */
  .vp-ctrl {
    background: #ffffff;
    border: 1px solid #e9e7f8;
    border-radius: 16px;
    padding: 14px 16px;
    transition: border-color .2s ease, box-shadow .2s ease;
    box-shadow: 0 2px 12px rgba(99,102,241,.04);
  }
  .vp-ctrl:hover {
    border-color: rgba(99,102,241,.3);
    box-shadow: 0 4px 20px rgba(99,102,241,.1);
  }

  .vp-ctrl-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .5px;
    text-transform: uppercase;
    color: #374151;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .vp-ctrl-title span.icon {
    font-size: 13px;
    opacity: .9;
  }

  .vp-ctrl-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #4b5563;
    margin-top: 8px;
    display: block;
  }

  /* Slider overrides */
  .vp-slider [data-orientation=horizontal] { height: 4px; }
  .vp-slider [role=slider] {
    width: 16px !important; height: 16px !important;
    background: #6366f1 !important;
    border: 2px solid #fff !important;
    box-shadow: 0 0 0 2px rgba(99,102,241,.3), 0 2px 8px rgba(99,102,241,.25) !important;
    transition: box-shadow .15s ease !important;
  }
  .vp-slider [role=slider]:hover {
    box-shadow: 0 0 0 4px rgba(99,102,241,.2), 0 2px 8px rgba(99,102,241,.3) !important;
  }

  /* Color swatch */
  .vp-swatch {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform .2s ease, box-shadow .2s ease;
    flex-shrink: 0;
  }
  .vp-swatch:hover { transform: scale(1.1); box-shadow: 0 4px 16px rgba(0,0,0,.15); }
  .vp-swatch input[type=color] {
    position: absolute; inset: -6px;
    width: calc(100% + 12px); height: calc(100% + 12px);
    opacity: 0; cursor: pointer;
  }

  .vp-hex {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #4b5563;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 4px 9px;
    border-radius: 6px;
    letter-spacing: .5px;
  }

  /* Select overrides */
  .vp-select-trigger {
    width: 100% !important;
    height: 36px !important;
    border-radius: 10px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    border: 1px solid #e0e7ff !important;
    background: #f5f3ff !important;
    color: #4338ca !important;
  }

  /* ── Render button ── */
  .vp-render-btn {
    width: 100%;
    height: 48px;
    border: none;
    border-radius: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .3px;
    color: white;
    background: linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea);
    background-size: 200% 200%;
    animation: vp-gradient 4s ease infinite;
    box-shadow: 0 4px 24px rgba(99,102,241,.4), inset 0 1px 0 rgba(255,255,255,.15);
    cursor: pointer;
    transition: transform .2s ease, box-shadow .2s ease;
    position: relative;
    overflow: hidden;
    margin-top: 4px;
  }
  .vp-render-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.12), transparent);
    opacity: 0;
    transition: opacity .2s;
  }
  .vp-render-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(99,102,241,.55), inset 0 1px 0 rgba(255,255,255,.15);
  }
  .vp-render-btn:hover::before { opacity: 1; }
  .vp-render-btn:active { transform: translateY(0); }

  /* ── Loading screen ── */
  .vp-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    background: #ffffff;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .vp-skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,.04) 25%, rgba(0,0,0,.08) 50%, rgba(0,0,0,.04) 75%);
    background-size: 200% 100%;
    animation: vp-shimmer 1.6s ease infinite;
    border-radius: 12px;
  }

  /* Scrollbar */
  .vp-sidebar::-webkit-scrollbar { width: 3px; }
  .vp-sidebar::-webkit-scrollbar-thumb { background: rgba(99,102,241,.3); border-radius: 3px; }

  @media (max-width: 768px) {
    .vp-content { grid-template-columns: 1fr; }
    .vp-sidebar { position: static; }
  }
`;

/* ─── Loading Screen ─────────────────────────────────────────── */
function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="vp-loading">
      <div
        style={{ display: "flex", alignItems: "center", gap: 4, height: 48 }}
      >
        {[20, 32, 44, 36, 24, 38, 48, 30, 20, 40, 48, 34, 22].map((h, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: h,
              borderRadius: 8,
              background: `linear-gradient(to top, rgba(99,102,241,.3), #818cf8)`,
              animation: `vp-barUp 1s ease-in-out ${i * 0.07}s infinite`,
            }}
          />
        ))}
      </div>

      <div style={{ position: "relative", width: 56, height: 56 }}>
        {[0, 0.35, 0.7].map((delay, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              border: "1.5px solid rgba(129,140,248,.6)",
              borderRadius: "50%",
              animation: `vp-ripple 1.8s ease-out ${delay}s infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: "18px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "50%",
            animation: "vp-spin 1s linear infinite",
          }}
        />
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#1e1b4b",
            marginBottom: 6,
          }}
        >
          {text}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            animation: "vp-pulse 2s ease infinite",
            margin: 0,
          }}
        >
          Hang tight, magic is happening…
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, opacity: 0.5 }}>
        <div className="vp-skeleton" style={{ width: 200, height: 120 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[150, 110, 130].map((w, i) => (
            <div
              key={i}
              className="vp-skeleton"
              style={{ width: w, height: 44, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Control Card ───────────────────────────────────────────── */
function ControlCard({
  icon,
  title,
  children,
  delay = 0,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className="vp-ctrl" style={{ animationDelay: `${delay}s` }}>
      <div className="vp-ctrl-title">
        <span className="icon">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function VideoPlayer() {
  const navigate = useNavigate();
  const videoUrl = "http://127.0.0.1:8000/api/video";
  const videoRef = useRef<HTMLVideoElement>(null);

  const [captionData, setCaptionData] = useState<CaptionPayload | null>(null);
  const [emojiData, setEmojiData] = useState<EmojiPayload | null>(null);
  const [currentText, setCurrentText] = useState<string>("");
  const [currentEmoji, setCurrentEmoji] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>(
    "Loading caption configuration...",
  );

  useEffect(() => {
    const id = "vp-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = INJECTED_CSS;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setLoadingText("Loading caption configuration...");
    fetch("http://127.0.0.1:8000/api/captions")
      .then((r) => {
        if (!r.ok) throw new Error("Failed captions");
        return r.json();
      })
      .then((data: CaptionPayload) => {
        setCaptionData(data);
        if (!data.segments?.length) {
          setIsLoading(false);
          return;
        }
        setLoadingText("Applying AI emoji magic to your captions...");
        return fetch("http://127.0.0.1:8000/cool-captions-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.segments),
        });
      })
      .then((res) => {
        if (!res) return;
        if (!res.ok) throw new Error("Failed emojis");
        return res.json();
      })
      .then(
        (payload: {
          status: string;
          data: { emojis: EmojiSegment[] };
          globalStyles: EmojiGlobalStyles;
        }) => {
          if (!payload) return;
          setEmojiData({
            status: payload.status,
            data: payload.data.emojis,
            globalStyles: payload.globalStyles,
          });
          setIsLoading(false);
        },
      )
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current || !captionData) return;
    const t = videoRef.current.currentTime;
    setCurrentText(
      captionData.segments.find((s) => t >= s.start && t <= s.end)?.text ?? "",
    );
    setCurrentEmoji(
      emojiData?.data.find((s) => t >= s.start && t <= s.end)?.emoji ?? "",
    );
  };

  const handleRender = () => {
    if (!captionData) {
      alert("No Caption Data Found");
      return;
    }
    navigate("/cool-captions/render", { state: { captionData, emojiData } });
  };

  if (isLoading) return <LoadingScreen text={loadingText} />;
  if (!captionData)
    return (
      <div className="vp-loading" style={{ color: "#6b7280", fontSize: 14 }}>
        Loading setup assets…
      </div>
    );

  const { globalStyles } = captionData;

  return (
    <div className="vp-root">
      {/* ── Main ── */}
      <main className="vp-main">
        {/* Page title */}
        <div className="vp-page-title">
          <h1>
            Cool <span>Captions</span>
          </h1>
          <p>Customize and preview your captions in real time</p>
        </div>

        {/* Segments badge */}
        <div className="vp-badge">
          <span className="vp-badge-dot" />
          {captionData.segments.length} caption segments · Live preview
        </div>

        {/* Content */}
        <div className="vp-content">
          {/* Video */}
          <div className="vp-video-card">
            <div className="vp-video-wrap">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                muted
                onTimeUpdate={handleTimeUpdate}
              />

              {currentText && (
                <div
                  className={`vp-caption-overlay ${captionData.globalStyles.fontFamily ?? "font-impact"}`}
                  style={{
                    top: `${globalStyles.positionY}%`,
                    fontSize: `${globalStyles.fontSize}px`,
                    color: globalStyles.primaryColor,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    textShadow: `
                      0 0 6px ${globalStyles.primaryColor}60,
                      2px 3px 8px rgba(0,0,0,.95),
                      4px 8px 20px rgba(0,0,0,.7)
                    `,
                  }}
                >
                  {currentText}
                </div>
              )}

              {currentEmoji && (
                <div
                  className="vp-emoji-overlay"
                  style={{
                    top: `${emojiData?.globalStyles.positionY}%`,
                    fontSize: `${emojiData?.globalStyles.fontSize}px`,
                    backgroundColor: emojiData?.globalStyles.backgroundColor,
                  }}
                >
                  {currentEmoji}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="vp-sidebar">
            <div className="vp-sidebar-label">Controls</div>

            {/* Caption Position */}
            <ControlCard icon="↕" title="Caption Position" delay={0.05}>
              <div className="vp-slider">
                <Slider
                  value={[captionData.globalStyles.positionY ?? 75]}
                  max={100}
                  step={1}
                  onValueChange={([v]) =>
                    setCaptionData((p) =>
                      p
                        ? {
                            ...p,
                            globalStyles: { ...p.globalStyles, positionY: v },
                          }
                        : null,
                    )
                  }
                />
              </div>
              <span className="vp-ctrl-value">
                {captionData.globalStyles.positionY}% from top
              </span>
            </ControlCard>

            {/* Font Size */}
            <ControlCard icon="Aa" title="Font Size" delay={0.1}>
              <div className="vp-slider">
                <Slider
                  value={[captionData.globalStyles.fontSize ?? 40]}
                  max={50}
                  step={1}
                  onValueChange={([v]) =>
                    setCaptionData((p) =>
                      p
                        ? {
                            ...p,
                            globalStyles: { ...p.globalStyles, fontSize: v },
                          }
                        : null,
                    )
                  }
                />
              </div>
              <span className="vp-ctrl-value">
                {captionData.globalStyles.fontSize}px
              </span>
            </ControlCard>

            {/* Font Family */}
            <ControlCard icon="𝐓" title="Font Family" delay={0.15}>
              <Select
                value={captionData.globalStyles.fontFamily ?? "font-impact"}
                onValueChange={(v) =>
                  setCaptionData((p) =>
                    p
                      ? {
                          ...p,
                          globalStyles: { ...p.globalStyles, fontFamily: v },
                        }
                      : null,
                  )
                }
              >
                <SelectTrigger className="vp-select-trigger">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span className={f.value}>{f.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlCard>

            {/* Font Color */}
            <ControlCard icon="🎨" title="Font Color" delay={0.2}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  className="vp-swatch"
                  style={{
                    background:
                      captionData.globalStyles.primaryColor ?? "#ffffff",
                  }}
                >
                  <input
                    type="color"
                    value={captionData.globalStyles.primaryColor ?? "#ffffff"}
                    onChange={(e) =>
                      setCaptionData((p) =>
                        p
                          ? {
                              ...p,
                              globalStyles: {
                                ...p.globalStyles,
                                primaryColor: e.target.value,
                              },
                            }
                          : null,
                      )
                    }
                  />
                </div>
                <span className="vp-hex">
                  {captionData.globalStyles.primaryColor?.toUpperCase() ??
                    "#FFFFFF"}
                </span>
              </div>
            </ControlCard>

            {/* Emoji Position */}
            <ControlCard icon="✨" title="Emoji Position" delay={0.25}>
              <div className="vp-slider">
                <Slider
                  value={[emojiData?.globalStyles.positionY ?? 55]}
                  max={100}
                  step={1}
                  onValueChange={([v]) =>
                    setEmojiData((p) =>
                      p
                        ? {
                            ...p,
                            globalStyles: { ...p.globalStyles, positionY: v },
                          }
                        : null,
                    )
                  }
                />
              </div>
              <span className="vp-ctrl-value">
                {emojiData?.globalStyles.positionY ?? 55}% from top
              </span>
            </ControlCard>

            {/* Emoji Size */}
            <ControlCard icon="😄" title="Emoji Size" delay={0.3}>
              <div className="vp-slider">
                <Slider
                  value={[emojiData?.globalStyles.fontSize ?? 40]}
                  max={80}
                  step={1}
                  onValueChange={([v]) =>
                    setEmojiData((p) =>
                      p
                        ? {
                            ...p,
                            globalStyles: { ...p.globalStyles, fontSize: v },
                          }
                        : null,
                    )
                  }
                />
              </div>
              <span className="vp-ctrl-value">
                {emojiData?.globalStyles.fontSize ?? 40}px
              </span>
            </ControlCard>

            {/* Render */}
            <button className="vp-render-btn" onClick={handleRender}>
              🎬 &nbsp; Render Video
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
