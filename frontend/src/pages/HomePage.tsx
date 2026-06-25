import React from 'react';
import { Link } from 'react-router';
import {
  Captions,
  Film,
  Megaphone,
  Laugh,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Coins,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  points: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export default function HomePage() {
  const features: Feature[] = [
    {
      id: 'cool-captions',
      name: 'CoolCaptions',
      slug: '/cool-captions/transcribe',
      description: 'Transform talking-head videos into high-engagement content automatically.',
      points: [
        'Automated accurate caption generation',
        'Smart visual highlights and dynamic emphasis points',
        'Contextual cutaway and icon suggestions',
      ],
      icon: Captions,
    },
    {
      id: 'text-2-reel',
      name: 'Text2Reel',
      slug: '/text-to-reel',
      description: 'Convert scripts, articles, or text posts into ready-to-publish short reels.',
      points: [
        'Scene-by-scene visual direction AI generation',
        'Automated matching text captions',
        'Optional natural AI voiceover integration',
      ],
      icon: Film,
    },
    {
      id: 'product-ads',
      name: 'ProductAds',
      slug: '/product-ads',
      description: 'Turn static product media into high-conversion promotional assets.',
      points: [
        'Instant motion graphics and smooth transitions',
        'Brand-aligned messaging and targeted CTAs',
        'Optimized for social commerce algorithms',
      ],
      icon: Megaphone,
    },
    {
      id: 'mister-memer',
      name: 'Mister_Memer',
      slug: '/mister-memer/generate',
      description: 'Keep your feed active with brand-safe, hyper-relevant meme content.',
      points: [
        'Audience tone and engagement style matching',
        'Low-effort, high-frequency posting schedules',
        'Culturally relevant, brand-protected generation',
      ],
      icon: Laugh,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-accent transition-colors duration-500">
      {/* 1. FIXED TOPBAR */}
      <Navbar />

      <main className="">
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden">
          {/* Ambient background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent blur-3xl dark:from-indigo-500/25 dark:via-fuchsia-500/15" />
            <div className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-400/10 to-transparent blur-3xl dark:from-cyan-400/15" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 text-center">
            {/* Motto pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 backdrop-blur-sm px-3.5 py-1.5 mb-8 transition-all duration-300 hover:border-foreground/20 hover:bg-secondary">
              <Coins className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-medium text-muted-foreground">
                Making reels at extremely low token costs
              </span>
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.05] transition-colors duration-500">
              Automate your{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-fuchsia-400 dark:to-cyan-400">
                short-form
              </span>
              <br />
              brand content.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              AutoReelEngine uses advanced multimodal AI to generate text, images, videos,
              and voiceovers—keeping your brand consistently active and perfectly aligned.
              Production-quality output at a fraction of the cost.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/cool-captions/transcribe"
                className="group inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="#features"
                className="inline-flex items-center gap-2 border border-border bg-background/50 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              >
                See Features
              </Link>
            </div>

            {/* Stats strip */}
            <div className="mt-16 grid grid-cols-3 max-w-xl mx-auto gap-px bg-border rounded-2xl overflow-hidden border border-border">
              {[
                { label: 'Avg. cost / reel', value: '< $0.05' },
                { label: 'Generation time', value: '~ 60s' },
                { label: 'Tokens per reel', value: '~ 4k' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-background p-4 sm:p-5 transition-colors duration-300"
                >
                  <div className="text-lg sm:text-xl font-semibold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="max-w-7xl mx-auto border-border transition-colors duration-300" />

        {/* 3. FEATURE SECTIONS */}
        <section
          id="features"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            const reversed = idx % 2 === 1;
            return (
              <div
                key={feature.id}
                id={feature.id}
                className="py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-b border-border last:border-none transition-colors duration-300"
              >
                {/* Left Side: Text and Points */}
                <div className={`space-y-6 ${reversed ? 'md:order-2' : ''}`}>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Zap className="w-3 h-3" />
                      Feature
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                      {feature.name}
                    </h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.points.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <Link
                      to={feature.slug}
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:opacity-70 transition-opacity duration-200"
                    >
                      Try {feature.name}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>

                {/* Right Side: Icon */}
                <div className={`flex justify-center ${reversed ? 'md:order-1 md:justify-start' : 'md:justify-end'}`}>
                  <div className="group relative w-56 h-56 sm:w-72 sm:h-72 rounded-3xl bg-secondary/50 border border-border flex items-center justify-center transition-all duration-500 hover:scale-[1.02] hover:border-foreground/20 hover:bg-secondary">
                    {/* Subtle inner gradient */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 via-transparent to-fuchsia-500/5 dark:from-indigo-400/10 dark:to-fuchsia-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <IconComponent className="relative w-24 h-24 sm:w-32 sm:h-32 text-foreground stroke-[1.25] transition-transform duration-500 group-hover:scale-105" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* 4. CALL TO ACTION SECTION */}
        <section className="relative border-y border-border bg-secondary/40 transition-colors duration-300">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-t from-indigo-500/15 to-transparent blur-3xl dark:from-indigo-500/20" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 mb-6">
              <Coins className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-medium text-muted-foreground">
                Built for startups that ship
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-5 leading-tight">
              Production-quality reels,
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-fuchsia-400 dark:to-cyan-400">
                token-budget pricing.
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-sm sm:text-base leading-relaxed">
              Stop spending hours planning, editing, and scripting. Scale your organic reach
              and maintain your custom brand identity layer seamlessly with autonomous
              workflow pipelines.
            </p>
            <Link
              to="/cool-captions/transcribe"
              className="group inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Start Automating Today
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-background border-t border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AutoReelEngine Inc. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors duration-200">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}