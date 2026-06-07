import React from "react";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <p className="text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} AutoReelEngine Inc. All rights
          reserved.
        </p>
        <div className="flex space-x-6 text-xs text-zinc-400">
          <a href="#" className="hover:text-zinc-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-zinc-600 transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
