import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  Captions,
  Film,
  Megaphone,
  Laugh,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  points: string[];
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

// ── Intersection Observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, inView } = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = to / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) {
        setVal(to);
        clearInterval(timer);
      } else setVal(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

// ── Feature card ────────────────────────────────────────────────────────────
function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const { ref, inView } = useInView(0.1);
  const isEven = index % 2 === 0;
  const IconComponent = feature.icon;

  return (
    <div
      ref={ref}
      className={`feature-row ${inView ? "visible" : ""}`}
      style={{ "--delay": `${index * 80}ms` } as React.CSSProperties}
    >
      <div
        className={`py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center border-b border-zinc-100 last:border-none ${isEven ? "" : "md:[direction:rtl]"}`}
      >
        {/* Text side */}
        <div className={`space-y-6 ${isEven ? "" : "md:[direction:ltr]"}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-semibold uppercase tracking-widest">
                {feature.tag}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {feature.name}
            </h2>
            <p className="text-zinc-500 leading-relaxed text-sm sm:text-base">
              {feature.description}
            </p>
          </div>

          <ul className="space-y-3">
            {feature.points.map((point, i) => (
              <li
                key={i}
                className="point-item flex items-start gap-3 text-sm text-zinc-600"
                style={
                  {
                    "--point-delay": `${i * 100 + 200}ms`,
                  } as React.CSSProperties
                }
              >
                <span className="mt-0.5 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <Link
            to={feature.slug}
            className="try-link inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 group"
          >
            <span className="underline-anim">Try {feature.name}</span>
            <span className="arrow-wrap">
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        {/* Icon side */}
        <div
          className={`flex justify-center ${isEven ? "md:justify-end" : "md:justify-start md:[direction:ltr]"}`}
        >
          <div className="icon-card relative w-52 h-52 sm:w-64 sm:h-64 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden group cursor-default">
            {/* Subtle animated background rings */}
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
            <IconComponent className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 text-zinc-800 stroke-[1.25] transition-transform duration-500 group-hover:scale-110" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  const features: Feature[] = [
    {
      id: "cool-captions",
      name: "CoolCaptions",
      slug: "/cool-captions/transcribe",
      tag: "Captions & Highlights",
      description:
        "Transform talking-head videos into high-engagement content automatically.",
      points: [
        "Automated accurate caption generation",
        "Smart visual highlights and dynamic emphasis points",
        "Contextual cutaway and icon suggestions",
      ],
      icon: Captions,
    },
    {
      id: "text-2-reel",
      name: "Text2Reel",
      slug: "/text-to-reel",
      tag: "Script to Video",
      description:
        "Convert scripts, articles, or text posts into ready-to-publish short reels.",
      points: [
        "Scene-by-scene visual direction AI generation",
        "Automated matching text captions",
        "Optional natural AI voiceover integration",
      ],
      icon: Film,
    },
    {
      id: "product-ads",
      name: "ProductAds",
      slug: "/",
      tag: "Promotional Assets",
      description:
        "Turn static product media into high-conversion promotional assets.",
      points: [
        "Instant motion graphics and smooth transitions",
        "Brand-aligned messaging and targeted CTAs",
        "Optimized for social commerce algorithms",
      ],
      icon: Megaphone,
    },
    {
      id: "mister-memer",
      name: "Mister_Memer",
      slug: "/mister-memer/generate",
      tag: "Meme Engine",
      description:
        "Keep your feed active with brand-safe, hyper-relevant meme content.",
      points: [
        "Audience tone and engagement style matching",
        "Low-effort, high-frequency posting schedules",
        "Culturally relevant, brand-protected generation",
      ],
      icon: Laugh,
    },
  ];

  const stats = [
    { icon: Zap, label: "Faster than manual", value: 40, suffix: "x" },
    { icon: TrendingUp, label: "Avg. engagement lift", value: 3, suffix: "x" },
    { icon: Clock, label: "Hours saved / week", value: 12, suffix: "h" },
    { icon: Users, label: "Content types automated", value: 4, suffix: "" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        @keyframes ring-pulse {
          0%   { transform: scale(1);   opacity: 0.12; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* Hero */
        .hero-badge  { animation: fadeUp 0.5s ease both; }
        .hero-h1     { animation: fadeUp 0.6s 0.1s ease both; }
        .hero-sub    { animation: fadeUp 0.6s 0.2s ease both; }
        .hero-cta    { animation: fadeUp 0.6s 0.3s ease both; }
        .hero-stats  { animation: fadeUp 0.6s 0.45s ease both; }

        /* Feature rows */
        .feature-row {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.6s ease, transform 0.6s ease;
          transition-delay: var(--delay, 0ms);
        }
        .feature-row.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Point items inherit parent visibility */
        .feature-row.visible .point-item {
          animation: fadeUp 0.5s ease both;
          animation-delay: var(--point-delay, 0ms);
        }

        /* Icon card rings */
        .icon-card .ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid #18181b;
          width: 80%; height: 80%;
          animation: ring-pulse 3s ease-out infinite;
        }
        .icon-card .ring-2 { animation-delay: 1s; }
        .icon-card .ring-3 { animation-delay: 2s; }

        /* Try link underline animation */
        .underline-anim {
          position: relative;
        }
        .underline-anim::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          height: 1.5px;
          width: 0;
          background: #18181b;
          transition: width 0.3s ease;
        }
        .try-link:hover .underline-anim::after {
          width: 100%;
        }

        /* CTA section */
        .cta-section {
          animation: scaleIn 0.7s ease both;
        }

        /* Stat card hover */
        .stat-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
        }

        /* Ticker tape */
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-inner {
          display: flex;
          width: max-content;
          animation: ticker 22s linear infinite;
        }
        .ticker-inner:hover { animation-play-state: paused; }
      `}</style>

      <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-100">
        <main className="pt-16">
          {/* ── HERO ───────────────────────────────────────────────────── */}
          <section
            ref={heroRef}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center"
          >
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />
              AI-Powered Content Engine
            </div>

            <h1 className="hero-h1 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 mb-6 leading-[1.08]">
              Automate your short-form
              <br />
              <span className="relative inline-block">
                brand content.
                {/* Subtle squiggle underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="6"
                  viewBox="0 0 200 6"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 3 Q25 0 50 3 Q75 6 100 3 Q125 0 150 3 Q175 6 200 3"
                    stroke="#18181b"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.25"
                  />
                </svg>
              </span>
            </h1>

            <p className="hero-sub text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              AutoReelEngine uses advanced multimodal AI to generate text,
              images, videos, and voiceovers—keeping your brand consistently
              active and perfectly aligned.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Link
                to="/cool-captions/transcribe"
                className="inline-flex items-center gap-2 bg-zinc-900 text-white px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-zinc-700 transition-colors shadow-sm group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="#cool-captions"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-zinc-600 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              >
                See Features
              </Link>
            </div>

            {/* Stats row */}
            <div className="hero-stats grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={i}
                    className="stat-card flex flex-col items-center gap-1.5 p-4 rounded-2xl border border-zinc-100 bg-zinc-50"
                  >
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-2xl font-bold text-zinc-900 tabular-nums">
                      <Counter to={s.value} suffix={s.suffix} />
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium text-center leading-tight">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── TICKER ─────────────────────────────────────────────────── */}
          <div className="border-y border-zinc-100 py-3 overflow-hidden select-none">
            <div className="ticker-inner">
              {[...Array(2)].map((_, ri) => (
                <div key={ri} className="flex items-center">
                  {[
                    "CoolCaptions",
                    "Text2Reel",
                    "ProductAds",
                    "Mister_Memer",
                    "AI Voiceover",
                    "Auto Captions",
                    "Brand Content",
                    "Short-Form Video",
                    "Meme Engine",
                    "Visual Direction",
                  ].map((t, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-4 px-8 text-xs font-semibold uppercase tracking-widest text-zinc-400"
                    >
                      <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <hr className="max-w-7xl mx-auto border-zinc-100 mt-0" />

          {/* ── FEATURE SECTIONS ───────────────────────────────────────── */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {features.map((feature, index) => (
              <div key={feature.id} id={feature.id}>
                <FeatureRow feature={feature} index={index} />
              </div>
            ))}
          </section>

          {/* ── CTA ────────────────────────────────────────────────────── */}
          <section className="bg-zinc-50 border-y border-zinc-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
              {/* Floating icons decoration */}
              <div className="flex justify-center gap-3 mb-8">
                {[Captions, Film, Megaphone, Laugh].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm"
                    style={{ animation: `fadeUp 0.5s ${i * 80}ms ease both` }}
                  >
                    <Icon className="w-4 h-4 text-zinc-700 stroke-[1.5]" />
                  </div>
                ))}
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
                Built for Startups & SMBs
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto mb-10 text-sm sm:text-base leading-relaxed">
                Stop spending hours planning, editing, and scripting. Scale your
                organic reach and maintain your custom brand identity layer
                seamlessly with autonomous workflow pipelines.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/cool-captions/transcribe"
                  className="inline-flex items-center gap-2 bg-zinc-900 text-white px-7 py-3.5 rounded-md text-sm font-semibold hover:bg-zinc-700 transition-colors group"
                >
                  Start Automating Today
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
                {[
                  "No credit card required",
                  "Cancel anytime",
                  "Works in minutes",
                ].map((t, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
