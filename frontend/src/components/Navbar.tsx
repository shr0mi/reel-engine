import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  Menu,
  X,
  Captions,
  Film,
  Megaphone,
  Laugh,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  points: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
    <>
      {/* 1. FIXED TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-foreground transition-colors duration-300"
          >
            AutoReel<span className="text-muted-foreground">Engine</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {features.map((feature) => (
              <Link
                key={feature.id}
                to={feature.slug}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {feature.name}
              </Link>
            ))}

            {/* Settings */}
            <Link
              to="/brand-consistency"
              aria-label="Settings"
              title="Settings"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <Sun
                className={`absolute w-4 h-4 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'opacity-0 -rotate-90 scale-50'
                    : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <Moon
                className={`absolute w-4 h-4 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'opacity-100 rotate-0 scale-100'
                    : 'opacity-0 rotate-90 scale-50'
                }`}
              />
            </button>
          </nav>

          {/* Mobile Menu + Theme Toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Sun
                className={`absolute w-4 h-4 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'opacity-0 -rotate-90 scale-50'
                    : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <Moon
                className={`absolute w-4 h-4 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'opacity-100 rotate-0 scale-100'
                    : 'opacity-0 rotate-90 scale-50'
                }`}
              />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-b border-border bg-background px-4 pt-2 pb-4 space-y-1 shadow-sm transition-colors duration-300">
            {features.map((feature) => (
              <Link
                key={feature.id}
                to={feature.slug}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              >
                {feature.name}
              </Link>
            ))}
            <Link
              to="/brand-consistency"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            >
              Settings
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}