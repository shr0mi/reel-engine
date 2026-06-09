import {useEffect, useState} from "react";
import { 
  ArrowRight, 
  Loader2, 
  Building2,
  FileText,
  Target,
  Heart,
  Sparkles,
  Save
} from 'lucide-react';
import Navbar from "@/components/Navbar";

interface BrandDetails{
    brandName: string;
    brandDescription: string;
    customerProfile: string;
    contentPreferences: string;
}

export default function BrandAgentPage() {

    const [isLoading, setIsLoading] = useState(false);

    // States to manage input, loading, and the final output
    const [prompt, setPrompt] = useState<string>('');
    const [promptLoading, setPromptLoading] = useState<boolean>(false);

    // Card 2 States (initialized empty, populated by the API, and editable by the user)
    const [brandName, setBrandName] = useState<string>('');
    const [brandDescription, setBrandDescription] = useState<string>('');
    const [customerProfile, setCustomerProfile] = useState<string>('');
    const [contentPreferences, setContentPreferences] = useState<string>('');
    const [brandProfileLoading, setBrandProfileLoading] = useState<boolean>(false);


    // At start load all the existing brand details
    useEffect(() => {
        setIsLoading(true);
        const fetchBrandDetails = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/brand-agent/brand-profile');
                const data = await response.json();
                setBrandName(data.brand_name || '');
                setPrompt(data.brand_prompt || '');
                setBrandDescription(data.what_brand_does || '');
                setCustomerProfile(data.who_are_customers || '');
                setContentPreferences(data.what_customers_like || '');
            } catch (error) {
                console.error("Failed to fetch brand details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBrandDetails();
    }, []);


    const handleGenerate = async () => {
        if (!prompt.trim()) {
        alert("Please enter a brand prompt first.");
        return;
        }

        setPromptLoading(true);
        try {
        const response = await fetch('http://127.0.0.1:8000/api/brand-agent/brand/prompt', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ brand_prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();

        // Map the snake_case backend response to your camelCase Interface
        const mappedData: BrandDetails = {
            brandName: data.brand_name,
            brandDescription: data.what_brand_does,
            customerProfile: data.who_are_customers,
            contentPreferences: data.what_customers_like,
        };

        // Directly update individual input states with the returned data
        setBrandName(data.brand_name || '');
        setBrandDescription(data.what_brand_does || '');
        setCustomerProfile(data.who_are_customers || '');
        setContentPreferences(data.what_customers_like || '');


        console.log("Successfully fetched brand details:", mappedData);

        } catch (error) {
        console.error("Failed to generate brand details:", error);
        alert("Something went wrong while connecting to the AI agent.");
        } finally {
        setPromptLoading(false);
        }
    };


    const handleSaveBrandProfile = async () => {
        setBrandProfileLoading(true);

        try{
            const response = await fetch('http://127.0.0.1:8000/api/brand-agent/brand/details', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    brand_name: brandName,
                    "what_brand_does": brandDescription,
                    "who_are_customers": customerProfile,
                    "what_customers_like": contentPreferences
                }),
            })
        

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Brand profile saved successfully:", data);
        } catch (error) {
        console.error("Failed to generate brand details:", error);
        alert("Something went wrong while connecting to the AI agent.");
        } finally {
        setBrandProfileLoading(false);
        }

    }

    if(isLoading){
        return(
        <div className="flex flex-col items-center justify-center min-h-[200px] w-full gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="animate-pulse">Fetching Data From Backend...</span>
        </div>
      )
    }

    return(
        <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-100">
      
            {/* 1. FIXED TOPBAR */}
            <Navbar/>

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
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={promptLoading}
                        className="w-full h-40 min-h-[100px] rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y overflow-y-auto transition-all"
                        placeholder="Enter or review your main brand prompt guidelines here..."
                        />

                        {/* Action Button */}
                        <div className="flex justify-end">
                        <button 
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            onClick={handleGenerate}
                            disabled={promptLoading}
                        >
                            {promptLoading ? 'Generating...' : 'Generate'}
                            {
                                !promptLoading ? 
                                <ArrowRight className="w-4 h-4" /> :
                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            }   
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
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
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
                        value={brandDescription}
                        onChange={(e) => setBrandDescription(e.target.value)}
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
                        value={customerProfile}
                        onChange={(e) => setCustomerProfile(e.target.value)}
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
                        value={contentPreferences}
                        onChange={(e) => setContentPreferences(e.target.value)}
                        className="w-full h-24 min-h-[50px] rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y overflow-y-auto transition-all"
                        placeholder="e.g. In-depth case studies and minimalist graphics"
                        />
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end">
                        <button onClick={handleSaveBrandProfile} 
                        disabled={brandProfileLoading}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                            {brandProfileLoading ? 'Saving...' : 'Save Brand Profile'}
                            {
                                !brandProfileLoading ? 
                                <Save className="w-4 h-4" /> :
                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            }
                        </button>
                        </div>

                    </div>
                    </div>

                </div>
                </main>

         </div>
    )
}