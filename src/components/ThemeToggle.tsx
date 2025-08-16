'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  position?: 'fixed' | 'relative';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ 
  position = 'fixed', 
  className = '',
  size = 'md'
}: ThemeToggleProps) {
  const { theme, toggleTheme, isDark, themeColors } = useTheme();

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  };

  const positionClasses = position === 'fixed' 
    ? 'fixed top-4 right-4 sm:right-6 z-50' 
    : 'relative';

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${positionClasses}
        ${sizeClasses[size]}
        ${themeColors.cardBg} 
        backdrop-blur-md 
        ${themeColors.cardBorder} 
        border 
        shadow-lg 
        hover:scale-110 
        transition-all 
        duration-200 
        rounded-full
        group
        ${className}
      `}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        {/* Sun/Moon Icon with Animation */}
        <div className={`transition-all duration-300 ${isDark ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
          🌙
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}`}>
          ☀️
        </div>
      </div>

      {/* Tooltip */}
      <div className={`
        absolute -bottom-12 left-1/2 transform -translate-x-1/2
        ${themeColors.cardBg} backdrop-blur-sm ${themeColors.cardBorder} border
        px-3 py-1 rounded-lg text-xs ${themeColors.text}
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        whitespace-nowrap pointer-events-none
      `}>
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </div>
    </button>
  );
}
