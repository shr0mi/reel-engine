import {useState} from "react";
import { Link } from 'react-router';
import { 
  Menu, 
  X, 
  Captions, 
  Film, 
  Megaphone, 
  Laugh, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  FileText,
  Target,
  Heart,
  Sparkles,
  Save
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  points: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export default function BrandAgentPage() {
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
        slug: '/',
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

            <main className="pt-16 min-h-screen bg-white text-slate-900">
                <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                    
                    {/* Page Header */}
                    <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Brand Consistency Agent
                    </h1>
                    <p className="text-sm text-slate-500">
                        Define your brand identity and generate consistent marketing alignment.
                    </p>
                    </div>

                    {/* Card 1: Brand Prompt & Generate Button */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Your Brand Prompt</h2>
                        </div>
                        
                        {/* Scrollable Textfield */}
                        <textarea
                        className="w-full h-40 min-h-[100px] rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y overflow-y-auto transition-all"
                        placeholder="Enter or review your main brand prompt guidelines here..."
                        />

                        {/* Action Button */}
                        <div className="flex justify-end">
                        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                            Generate
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        </div>
                    </div>
                    </div>

                    {/* Card 2: Brand Profile Form */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6">
                        
                        {/* Field 1: Company Name */}
                        <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                            <Building2 className="w-3.5 h-3.5" />
                            Your company name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Acme Corp"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                        </div>

                        {/* Field 2: What your brand does */}
                        <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                            <FileText className="w-3.5 h-3.5" />
                            What your brand does
                        </label>
                        {/* Scrollable Textfield */}
                        <textarea
                        className="w-full h-24 min-h-[50px] rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y overflow-y-auto transition-all"
                        placeholder="e.g. Eco-friendly SaaS packaging solutions"
                        />
                        </div>

                        {/* Field 3: Who are your customers */}
                        <div className="space-y-2 md:col-span-1">
                        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                            <Target className="w-3.5 h-3.5" />
                            Who are your customers
                        </label>
                        {/* Scrollable Textfield */}
                        <textarea
                        className="w-full h-24 min-h-[50px] rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y overflow-y-auto transition-all"
                        placeholder="e.g. B2B e-commerce brand managers"
                        />
                        </div>

                        {/* Field 4: Content Preference */}
                        <div className="space-y-2 md:col-span-1">
                        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                            <Heart className="w-3.5 h-3.5" />
                            What kind of content do your customers like
                        </label>
                        {/* Scrollable Textfield */}
                        <textarea
                        className="w-full h-24 min-h-[50px] rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y overflow-y-auto transition-all"
                        placeholder="e.g. In-depth case studies and minimalist graphics"
                        />
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end">
                        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                            Save Brand Profile
                            <Save className="w-4 h-4" />
                        </button>
                        </div>

                    </div>
                    </div>

                </div>
                </main>

         </div>
    )
}