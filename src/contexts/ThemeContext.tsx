'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  themeColors: {
    primary: string;
    secondary: string;
    cardBg: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    accent: string;
    bgGradient: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // ✅ Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme || systemTheme);
  }, []);

  // ✅ Save theme to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('app-theme', theme);
      document.documentElement.className = theme;
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  // ✅ Complete theme colors
  const themeColors = {
    primary: isDark 
      ? 'from-slate-800 via-gray-800 to-slate-800' 
      : 'from-slate-900 via-blue-900 to-slate-900',
    secondary: isDark 
      ? 'from-gray-700/10 to-blue-700/10' 
      : 'from-blue-500/10 to-indigo-500/10',
    cardBg: isDark ? 'bg-gray-800/20' : 'bg-white/5',
    cardBorder: isDark ? 'border-gray-600/30' : 'border-white/10',
    text: isDark ? 'text-gray-100' : 'text-white',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-300',
    accent: isDark 
      ? 'from-blue-400 to-purple-400' 
      : 'from-blue-400 via-purple-400 to-blue-600',
    bgGradient: isDark 
      ? 'bg-gradient-to-br from-slate-800 via-gray-800 to-slate-800'
      : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
  };

  // ✅ Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, themeColors }}>
      <div className={themeColors.bgGradient + ' min-h-screen transition-all duration-300'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// ✅ Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
