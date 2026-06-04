import { Link } from 'react-router';
import { 
  Menu, 
  X, 
  Captions, 
  Film, 
  Megaphone, 
  Laugh, 
  ArrowRight, 
  Loader2, 
  Building2,
  FileText,
  Target,
  Heart,
  Sparkles,
  Save
} from 'lucide-react';
import { useState } from 'react';

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  points: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export default function TextToReelPage() {
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

    return(
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
                <h1>Text to Reel</h1>
            </main>

        </div>
    )
}