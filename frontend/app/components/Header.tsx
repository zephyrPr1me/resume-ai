'use client';

import { Sun, Moon, Cpu } from "lucide-react";

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function Header({ isDarkMode, toggleTheme }: HeaderProps) {
  return (
    <header className="border-b border-border/40 bg-background/85 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="w-[1285px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/10 transition-all duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-foreground">
              RESUME<span className="text-primary">.AI</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mt-0.5">
              Interactive ATS Analytics
            </p>
          </div>
        </div>

        {/* Action Controls & Info */}
        <div className="flex items-center gap-4">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-card-hover text-foreground hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            aria-label="Переключить тему оформления"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-accent-amber animate-spin" style={{ animationDuration: "12s" }} />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
