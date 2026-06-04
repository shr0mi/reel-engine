import React, { useState } from 'react';
import { Link } from 'react-router';
import { 
  Menu, 
  X, 
  Captions, 
  Film, 
  Megaphone, 
  Laugh, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  points: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features: Feature[] = [
    {
      id: 'cool-captions',
      name: 'CoolCaptions',
      slug: '/cool-captions/transcribe',
      description: 'Transform talking-head videos into high-engagement content automatically.',
      points: [
        'Automated accurate caption generation',
        'Smart visual highlights and dynamic emphasis points',
        'Contextual cutaway and icon suggestions'
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
        'Optional natural AI voiceover integration'
      ],
      icon: Film,
    },
    {
      id: 'product-ads',
      name: 'ProductAds',
      slug: '/',
      description: 'Turn static product media into high-conversion promotional assets.',
      points: [
        'Instant motion graphics and smooth transitions',
        'Brand-aligned messaging and targeted CTAs',
        'Optimized for social commerce algorithms'
      ],
      icon: Megaphone,
    },
    {
      id: 'mister-memer',
      name: 'Mister_Memer',
      slug: '/',
      description: 'Keep your feed active with brand-safe, hyper-relevant meme content.',
      points: [
        'Audience tone and engagement style matching',
        'Low-effort, high-frequency posting schedules',
        'Culturally relevant, brand-protected generation'
      ],
      icon: Laugh,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-100">
      
      {/* 1. FIXED TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-zinc-900">
            AutoReel<span className="text-zinc-500">Engine</span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-b border-zinc-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-sm">
            {features.map((feature) => (
              <Link
                key={feature.id}
                to={feature.slug}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                {feature.name}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="pt-16">
        {/* 2. HERO SECTION */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 mb-6">
            Automate your short-form brand content.
          </h1>
          <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            AutoReelEngine uses advanced multimodal AI to generate text, images, videos, and voiceovers—keeping your brand consistently active and perfectly aligned.
          </p>
          <div className="flex justify-center">
            <Link
              to="/cool-captions/transcribe"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <hr className="max-w-7xl mx-auto border-zinc-100" />

        {/* 3. FEATURE SECTIONS */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 division-y divide-zinc-100">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={feature.id} 
                id={feature.id}
                className="py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-b border-zinc-100 last:border-none"
              >
                {/* Left Side: Text and Points */}
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Feature</span>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-1">
                      {feature.name}
                    </h2>
                  </div>
                  <p className="text-zinc-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.points.map((point, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-zinc-600">
                        <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <Link 
                      to={feature.slug} 
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 hover:underline"
                    >
                      Try {feature.name} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Right Side: Icon */}
                <div className="flex justify-center md:justify-end">
                  <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center p-8 transition-transform hover:scale-[1.02]">
                    <IconComponent className="w-20 h-20 sm:w-28 sm:h-28 text-zinc-800 stroke-[1.25]" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* 4. CALL TO ACTION SECTION */}
        <section className="bg-zinc-50 border-y border-zinc-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
              Built for Startups & SMBs
            </h2>
            <p className="text-zinc-600 max-w-xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
              Stop spending hours planning, editing, and scripting. Scale your organic reach and maintain your custom brand identity layer seamlessly with autonomous workflow pipelines.
            </p>
            <Link
              to="/cool-captions/transcribe"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Start Automating Today
            </Link>
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} AutoReelEngine Inc. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs text-zinc-400">
            <a href="#" className="hover:text-zinc-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}