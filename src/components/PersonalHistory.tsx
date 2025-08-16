'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomAuth } from '@/hooks/useCustomAuth';
// ✅ ADDED: Theme imports
import { useTheme } from '@/hooks/useTheme';

interface InterviewHistory {
  id: number;
  skill: string;
  difficulty: string;
  total_score: number;
  avg_score: number;
  questions_attempted: number;
  is_completed: boolean;
  created_at: string;
  quit_reason?: string;
}

export default function PersonalHistory() {
  // ✅ ADDED: Global theme
  const { themeColors, isDark } = useTheme();

  const { userId, isAuthenticated } = useCustomAuth();
  const [interviews, setInterviews] = useState<InterviewHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && isAuthenticated) {
      fetchPersonalHistory();
    } else {
      setLoading(false);
    }
  }, [userId, isAuthenticated]);

  const fetchPersonalHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?user_id=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch interview history');
      }

      const data = await response.json();
      setInterviews(data.personalStats || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceText = (avgScore: number) => {
    if (avgScore >= 8) return "Excellent";
    if (avgScore >= 6) return "Good";
    return "Needs Improvement";
  };

  if (!isAuthenticated) {
    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-12 text-center ${themeColors.cardBorder} border shadow-xl`}>
        <div className="text-6xl mb-4">🔒</div>
        <h3 className={`text-2xl font-bold ${themeColors.text} mb-4`}>
          Please sign in to view your interview history and personal statistics.
        </h3>
        <Link
          href="/sign-in"
          className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-6 ${themeColors.cardBorder} border shadow-xl`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-600/30 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-600/20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-12 text-center ${themeColors.cardBorder} border shadow-xl`}>
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className={`text-xl font-bold ${themeColors.text} mb-4`}>
          Failed to Load Interview History
        </h3>
        <p className={`${themeColors.textSecondary} mb-6`}>{error}</p>
        <button
          onClick={fetchPersonalHistory}
          className={`px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-12 text-center ${themeColors.cardBorder} border shadow-xl`}>
        <div className="text-6xl mb-4">📊</div>
        <h3 className={`text-2xl font-bold ${themeColors.text} mb-4`}>
          You haven't completed any interviews yet. Start your first interview to see your progress here!
        </h3>
        <Link
          href="/start-interview"
          className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
        >
          Start Your First Interview
        </Link>
      </div>
    );
  }

  return (
    <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl shadow-xl ${themeColors.cardBorder} border overflow-hidden`}>
      <div className={`p-6 border-b ${themeColors.cardBorder}`}>
        <h2 className={`text-2xl font-bold ${themeColors.text} flex items-center`}>
          <span className="mr-3">📊</span>
          Complete record of your interview sessions and performance
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {interviews.map((interview, index) => (
          <div
            key={interview.id}
            className={`${themeColors.cardBg} backdrop-blur-sm rounded-xl p-6 ${themeColors.cardBorder} border hover:bg-white/5 transition-all duration-200 shadow-lg hover:shadow-xl`}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

              {/* Left Section - Basic Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className={`font-bold ${themeColors.text} text-lg`}>
                    {interview.skill}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(interview.difficulty)}`}>
                    {interview.difficulty.charAt(0).toUpperCase() + interview.difficulty.slice(1)}
                  </span>
                  {interview.is_completed ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-400/30">
                      ✅ Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm border border-amber-400/30">
                      ⏸️ Partial
                    </span>
                  )}
                </div>

                <div className={`${themeColors.textSecondary} text-sm space-y-1`}>
                  <p>
                    📅 {new Date(interview.created_at).toLocaleDateString()} at{" "}
                    {new Date(interview.created_at).toLocaleTimeString()}
                  </p>
                  <p>
                    🎯 Performance: <span className={`font-medium ${getScoreColor(interview.avg_score)}`}>
                      {getPerformanceText(interview.avg_score)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Section - Stats */}
              <div className="flex flex-wrap gap-6 lg:flex-col lg:items-end">
                <div className="text-center lg:text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(interview.avg_score)}`}>
                    {interview.avg_score.toFixed(1)}/10
                  </div>
                  <div className={`text-xs ${themeColors.textSecondary}`}>Average Score</div>
                </div>

                <div className="text-center lg:text-right">
                  <div className={`text-lg font-bold ${themeColors.text}`}>
                    {interview.questions_attempted}/10
                  </div>
                  <div className={`text-xs ${themeColors.textSecondary}`}>Questions</div>
                </div>

                <div className="text-center lg:text-right">
                  <div className={`text-lg font-bold ${themeColors.text}`}>
                    {interview.total_score}/100
                  </div>
                  <div className={`text-xs ${themeColors.textSecondary}`}>Total Score</div>
                </div>
              </div>
            </div>

            {/* Quit Reason (if applicable) */}
            {!interview.is_completed && interview.quit_reason && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg">
                <div className="text-amber-300 text-sm">
                  <strong>Quit Reason:</strong> {interview.quit_reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className={`p-4 border-t ${themeColors.cardBorder} ${themeColors.cardBg}`}>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className={`${themeColors.textSecondary}`}>
            <strong className={themeColors.text}>Total Interviews:</strong> {interviews.length}
          </div>
          <div className={`${themeColors.textSecondary}`}>
            <strong className={themeColors.text}>Completed:</strong> {interviews.filter(i => i.is_completed).length}
          </div>
          <div className={`${themeColors.textSecondary}`}>
            <strong className={themeColors.text}>Average Score:</strong> 
            <span className={`ml-1 ${getScoreColor(interviews.reduce((sum, i) => sum + i.avg_score, 0) / interviews.length)}`}>
              {interviews.length > 0 ? (interviews.reduce((sum, i) => sum + i.avg_score, 0) / interviews.length).toFixed(1) : '0.0'}/10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
