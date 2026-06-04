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

// Script Generation Interphases (first section)
interface ScriptInput {
  prompt: string;
  language: 'en' | 'bn';
  duration: 40 | 60 | 120;
}

interface StoryBlock {
  paragraph: number;
  spoken_text: string;
  visual_prompt: string[];
}

interface ScriptOutput {
  tone: string;
  story_blocks: StoryBlock[];
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

    // Program States

    // Script Generation States (first section)
    const [scriptInput, setScriptInput] = useState<ScriptInput>({
        prompt: '',
        language: 'en',
        duration: 40,
    });

    const [scriptOutput, setScriptOutput] = useState<ScriptOutput | null>(null);
    const [isScriptLoading, setIsScriptLoading] = useState<boolean>(false);
    const [scriptError, setScriptError] = useState<string | null>(null);


    // Api handlers 

    // Script Generation Api handlers (first section)
    const handleGenerateScript = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsScriptLoading(true);
        setScriptError(null);

        try {
        const response = await fetch('http://127.0.0.1:8000/api/text-to-reel/generate-script', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(scriptInput),
        });

        if (!response.ok) {
            throw new Error(`Server responded with a status of ${response.status}`);
        }

        const data: ScriptOutput = await response.json();
        
        setScriptOutput(data);
        
        } catch (err: any) {
        setScriptError(err.message || 'An unexpected error occurred while generating the script.');
        } finally {
        setIsScriptLoading(false);
        console.log(scriptOutput);
        }
    };

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

            <main className="pt-16 max-w-xl mx-auto">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-8 text-center">
                Text to Reel
                </h1>

                {/* First section: Script Generation */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <form onSubmit={handleGenerateScript} className="space-y-5">
                    {/* Prompt Input */}
                    <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt
                    </label>
                    <textarea
                        id="prompt"
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm resize-none"
                        placeholder="Describe your video idea..."
                        value={scriptInput.prompt}
                        onChange={(e) => setScriptInput({ ...scriptInput, prompt: e.target.value })}
                        required
                    />
                    </div>

                    {/* Select Options Grid */}
                    <div className="grid grid-cols-2 gap-4">
                    {/* Language Select */}
                    <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                        </label>
                        <select
                        id="language"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm"
                        value={scriptInput.language}
                        onChange={(e) => setScriptInput({ ...scriptInput, language: e.target.value as 'en' | 'bn' })}
                        >
                        <option value="en">English (en)</option>
                        <option value="bn">Bengali (bn)</option>
                        </select>
                    </div>

                    {/* Duration Select */}
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (seconds)
                        </label>
                        <select
                        id="duration"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-sm"
                        value={scriptInput.duration}
                        onChange={(e) => setScriptInput({ ...scriptInput, duration: Number(e.target.value) as 40 | 60 | 120 })}
                        >
                        <option value={40}>40s</option>
                        <option value={60}>60s</option>
                        <option value={120}>120s</option>
                        </select>
                    </div>
                    </div>

                    {/* Action Button */}
                    <button
                    type="submit"
                    disabled={isScriptLoading}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 disabled:bg-neutral-400 flex items-center justify-center gap-2"
                    >
                    {isScriptLoading ? (
                        <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Script...
                        </>
                    ) : (
                        'Generate Script'
                    )}
                    </button>
                </form>

                {/* Inline Error Message */}
                {scriptError && (
                    <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-lg text-red-600 text-sm font-medium">
                    {scriptError}
                    </div>
                )}
                </div>

            </main>

        </div>
    )
}