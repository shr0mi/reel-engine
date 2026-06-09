import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '@/components/Navbar';


export default function ProductAdsSelectionPage() {

  // State to store the selected template value
  const [selectedTemplate, setSelectedTemplate] = useState('phonk-style');
  const navigate = useNavigate();

  const handleCreate = () => {
    // Dynamic navigation based on the selected template state
    navigate(`/product-ads/${selectedTemplate}`);
  };


    return(
        <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-100">
              
              {/* 1. FIXED TOPBAR */}
              <Navbar/>
        
              <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                {/* Centered Card Container */}
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 transform transition-all hover:scale-[1.01]">
                    
                    {/* Card Header */}
                    <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        ProductAds
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Create AI generated ads based on viral templates.
                    </p>
                    </div>

                    {/* Card Body & Form */}
                    <div className="space-y-6">
                    <div>
                        <label 
                        htmlFor="template" 
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                        >
                        Select Template
                        </label>
                        <div className="relative">
                        <select
                            id="template"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none text-sm transition-all"
                        >
                            <option value="phonk-style">Phonk Style</option>
                        </select>
                        {/* Custom dropdown arrow icon */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                        </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleCreate}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Create
                    </button>
                    </div>

                </div>
                </main>
                    
        </div>

    )
}