'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProgressDashboard from '@/components/ProgressDashboard';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import Link from 'next/link';

export default function ProgressPage() {
  const { isSignedIn, isLoading, userName } = useCustomAuth();
  const { themeColors, isDark } = useTheme();

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col ${themeColors.bgGradient}`}>
        <ThemeToggle />
        <div className="flex-1 flex items-center justify-center">
          <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-12 ${themeColors.cardBorder} border shadow-2xl`}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mx-auto mb-4"></div>
            <div className={`${themeColors.text} text-lg font-semibold text-center`}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={`min-h-screen flex flex-col ${themeColors.bgGradient}`}>
        <ThemeToggle />
        <Navbar />

        <main className="flex-1 flex items-center justify-center px-4">
          <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-12 text-center max-w-md mx-4 shadow-2xl ${themeColors.cardBorder} border`}>
            <div className="text-6xl mb-6">🔒</div>
            <h2 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Progress Tracking</h2>
            <p className={`${themeColors.textSecondary} mb-8 leading-relaxed`}>
              Please sign in to view your progress and track your interview performance over time.
            </p>
            <div className="space-y-4">
              <Link
                href="/sign-in"
                className={`block w-full px-8 py-4 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-400/30`}
              >
                🔑 Sign In to Continue
              </Link>
              <Link
                href="/sign-up"
                className={`block w-full px-8 py-4 ${themeColors.cardBg} ${themeColors.text} rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm ${themeColors.cardBorder} border`}
              >
                🚀 Create Account
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bgGradient}`}>
      <ThemeToggle />
      <Navbar />

      {/* Header */}
      <div className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-6xl mb-4">📈</div>
          <h1 className={`text-4xl md:text-5xl font-bold ${themeColors.text} mb-4`}>
            Progress Tracking
          </h1>
          <p className={`text-xl ${themeColors.textSecondary} max-w-2xl mx-auto mb-4`}>
            Hi {userName}! Track your interview performance and improvements
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 pb-8">
        <ProgressDashboard />
      </main>

      <Footer />
    </div>
  );
}
