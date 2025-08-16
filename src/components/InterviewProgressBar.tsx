'use client';

import React from 'react';
// ✅ ADDED: Theme imports
import { useTheme } from '@/hooks/useTheme';

interface InterviewProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  skill: string;
  difficulty: string;
  elapsedTime?: string;
}

export default function InterviewProgressBar({
  currentQuestion,
  totalQuestions,
  skill,
  difficulty,
  elapsedTime
}: InterviewProgressBarProps) {
  // ✅ ADDED: Global theme
  const { themeColors, isDark } = useTheme();

  const progressPercentage = Math.round((currentQuestion / totalQuestions) * 100);

  const getDifficultyColor = () => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-200 border-green-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30';
      case 'hard': return 'bg-red-500/20 text-red-200 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-400/30';
    }
  };

  return (
    <div className={`${themeColors.cardBg} backdrop-blur-md ${themeColors.cardBorder} border-b shadow-xl`}>
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Top Section - Question Info & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">

          {/* Left - Question Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            <div className={`${themeColors.text} font-bold text-lg flex items-center space-x-2`}>
              <span className="text-2xl">🧠</span>
              <span>Question {currentQuestion} of {totalQuestions}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-blue-100 text-sm">
              <span className={`${themeColors.cardBg} backdrop-blur-sm px-3 py-1 rounded-full ${themeColors.cardBorder} border flex items-center space-x-1`}>
                <span>📚</span>
                <span>{skill}</span>
              </span>

              <span className={`px-3 py-1 rounded-full font-medium border ${getDifficultyColor()}`}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>

              {elapsedTime && (
                <span className={`${themeColors.cardBg} backdrop-blur-sm px-3 py-1 rounded-full ${themeColors.cardBorder} border flex items-center space-x-1`}>
                  <span>⏱️</span>
                  <span>{elapsedTime}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right - Progress Percentage */}
          <div className={`${themeColors.cardBg} backdrop-blur-sm px-4 py-2 rounded-full ${themeColors.cardBorder} border shadow-lg`}>
            <span className={`${themeColors.text} font-bold text-lg`}>
              {progressPercentage}% Complete
            </span>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className="space-y-3">

          {/* Progress Bar */}
          <div className={`w-full ${themeColors.cardBg} backdrop-blur-sm rounded-full h-4 overflow-hidden shadow-inner ${themeColors.cardBorder} border`}>
            <div 
              className={`bg-gradient-to-r ${themeColors.accent} h-4 rounded-full transition-all duration-500 ease-out shadow-sm relative`}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>

          {/* Question Indicators */}
          <div className="flex justify-center">
            <div className="flex space-x-1 max-w-full overflow-x-auto pb-2">
              {Array.from({ length: totalQuestions }, (_, idx) => (
                <div
                  key={idx}
                  className={`flex-shrink-0 w-3 h-3 rounded-full transition-all duration-300 ${
                    idx < currentQuestion 
                      ? 'bg-green-400 shadow-lg scale-110' 
                      : idx === currentQuestion - 1
                        ? `bg-gradient-to-r ${themeColors.accent} shadow-lg scale-125 animate-pulse`
                        : 'bg-white/30 scale-100'
                  }`}
                  title={`Question ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-200">
              <span className="font-medium">Answered:</span> {currentQuestion - 1}/{totalQuestions}
            </span>
            <span className="text-blue-200">
              <span className="font-medium">Remaining:</span> {totalQuestions - currentQuestion + 1} questions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
