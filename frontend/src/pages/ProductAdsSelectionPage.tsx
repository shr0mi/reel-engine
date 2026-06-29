import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '@/components/Navbar';


export default function ProductAdsSelectionPage() {


    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
            {/* 1. FIXED TOPBAR */}
            <Navbar />

            {/* Centered "Coming Soon" message */}
            <main className="min-h-screen flex items-center justify-center p-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground transition-colors duration-300">
                    Coming Soon
                </h1>
            </main>
        </div>
    );
}