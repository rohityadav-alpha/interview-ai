// D:\interview-ai\src\app\leaderboard\page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useUser } from '@clerk/nextjs';

interface LeaderboardEntry {
  id: number;
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_username: string;
  skill: string;
  difficulty: string;
  total_score: number;
  avg_score: number;
  questions_attempted: number;
  is_completed: boolean;
  created_at: string;
  global_rank?: number;
  interview_count?: number;
  quit_reason?: string;
  interview_duration?: number;
}

interface ApiResponse {
  success: boolean;
  globalLeaderboard: LeaderboardEntry[];
  personalStats: LeaderboardEntry[];
  message: string;
  error?: string;
  details?: string;
}

export default function LeaderboardPage() {
  const { themeColors, isDark } = useTheme();
  const { isSignedIn, user } = useUser();

  const [activeTab, setActiveTab] = useState<'global' | 'personal'>('global');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [personalStats, setPersonalStats] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIXED: Fetch data on component mount and tab change
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // ✅ FIXED: Fetch personal stats when switching to personal tab
  useEffect(() => {
    if (activeTab === 'personal' && isSignedIn && user?.id) {
      fetchPersonalStats();
    }
  }, [activeTab, isSignedIn, user?.id]);

  // ✅ FIXED: Proper API call for global leaderboard
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ For global leaderboard, don't pass user_id
      const response = await fetch('/api/leaderboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      if (data.success) {
        setGlobalLeaderboard(data.globalLeaderboard || []);
        } else {
        throw new Error(data.error || 'Failed to fetch global leaderboard');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch global leaderboard data');
      setGlobalLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Separate function for personal stats
  const fetchPersonalStats = async () => {
    if (!isSignedIn || !user?.id) {
      setPersonalStats([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ For personal stats, pass user_id as query parameter
      const response = await fetch(`/api/leaderboard?user_id=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 401) {
          setError('Please sign in to view your personal statistics');
        } else {
          setError(errorData.message || errorData.error || `HTTP ${response.status}`);
        }
        setPersonalStats([]);
        return;
      }

      const data: ApiResponse = await response.json();
      if (data.success) {
        setPersonalStats(data.personalStats || []);
        } else {
        throw new Error(data.error || 'Failed to fetch personal statistics');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch personal statistics');
      setPersonalStats([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Retry handler
  const handleRetry = () => {
    if (activeTab === 'global') {
      fetchLeaderboardData();
    } else {
      fetchPersonalStats();
    }
  };

  // ✅ Helper functions
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

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.user_first_name && entry.user_last_name) {
      return `${entry.user_first_name} ${entry.user_last_name}`;
    }
    if (entry.user_username) {
      return entry.user_username;
    }
    if (entry.user_email) {
      return entry.user_email.split('@')[0];
    }
    return 'Anonymous User';
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bgGradient}`}>
      <ThemeToggle />
      <Navbar />

      {/* Header */}
      <div className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className={`text-4xl md:text-5xl font-bold ${themeColors.text} mb-4`}>
            Interview Leaderboard
          </h1>
          <p className={`text-xl ${themeColors.textSecondary} max-w-2xl mx-auto`}>
            See how you rank against developers worldwide in AI-powered technical interviews
          </p>
          <div className="mt-6 text-sm text-blue-300">
            ✨ Compete with developers worldwide
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className={`flex ${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-2 ${themeColors.cardBorder} border shadow-xl`}>
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'global'
                ? `bg-gradient-to-r ${themeColors.accent} text-white shadow-lg`
                : `${themeColors.text} hover:bg-white/10`
            }`}
          >
            🌍 Global Rankings
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'personal'
                ? `bg-gradient-to-r ${themeColors.accent} text-white shadow-lg`
                : `${themeColors.text} hover:bg-white/10`
            }`}
          >
            📊 Your Stats
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-12 ${themeColors.cardBorder} border shadow-2xl`}>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mx-auto mb-4"></div>
              <div className={`${themeColors.text} text-lg font-semibold text-center`}>
                Loading {activeTab === 'global' ? 'global leaderboard' : 'your statistics'}...
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-12 text-center ${themeColors.cardBorder} border shadow-2xl max-w-md`}>
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className={`text-2xl font-bold ${themeColors.text} mb-4`}>Failed to Load</h2>
              <p className={`${themeColors.textSecondary} mb-6`}>{error}</p>
              <button
                onClick={handleRetry}
                className={`px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
              >
                🔄 Retry
              </button>
            </div>
          </div>
        ) : (
          <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl shadow-2xl ${themeColors.cardBorder} border overflow-hidden`}>
            {activeTab === 'global' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${themeColors.text}`}>🌍 Global Top Performers</h2>
                  <div className={`text-sm ${themeColors.textSecondary}`}>
                    Updated in real-time
                  </div>
                </div>

                {globalLeaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className={`text-xl font-bold ${themeColors.text} mb-2`}>No interviews completed yet</h3>
                    <p className={`${themeColors.textSecondary} mb-6`}>Be the first to appear on the leaderboard!</p>
                    <a
                      href="/start-interview"
                      className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
                    >
                      🎯 Start Interview →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {globalLeaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 rounded-xl ${themeColors.cardBg} ${themeColors.cardBorder} border hover:bg-white/5 transition-all duration-200 ${
                          index < 3 ? 'ring-2 ring-yellow-400/20' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold text-yellow-400 min-w-[3rem]">
                            {getRankEmoji(entry.global_rank || index + 1)} #{entry.global_rank || index + 1}
                          </div>
                          <div>
                            <div className={`font-bold ${themeColors.text}`}>
                              {getDisplayName(entry)}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-sm px-2 py-1 rounded-full ${getDifficultyColor(entry.difficulty)} border font-medium`}>
                                {entry.skill}
                              </span>
                              <span className={`text-sm px-2 py-1 rounded-full ${getDifficultyColor(entry.difficulty)} border`}>
                                {entry.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(entry.avg_score)}`}>
                            {entry.avg_score.toFixed(1)}/10
                          </div>
                          <div className={`text-sm ${themeColors.textSecondary}`}>
                            {entry.questions_attempted} questions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${themeColors.text}`}>📊 Your Performance</h2>
                  <div className={`text-sm ${themeColors.textSecondary}`}>
                    All your completed interviews
                  </div>
                </div>

                {!isSignedIn ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className={`text-xl font-bold ${themeColors.text} mb-2`}>Sign in Required</h3>
                    <p className={`${themeColors.textSecondary} mb-6`}>Please sign in to view your interview statistics</p>
                    <a
                      href="/sign-in"
                      className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
                    >
                      🔑 Sign In
                    </a>
                  </div>
                ) : personalStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className={`text-xl font-bold ${themeColors.text} mb-2`}>No interviews completed yet</h3>
                    <p className={`${themeColors.textSecondary} mb-6`}>Start your first interview to see your stats here!</p>
                    <a
                      href="/start-interview"
                      className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
                    >
                      🎯 Start Interview →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {personalStats.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 rounded-xl ${themeColors.cardBg} ${themeColors.cardBorder} border hover:bg-white/5 transition-all duration-200`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`text-2xl font-bold ${themeColors.text} min-w-[3rem]`}>
                            #{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm px-2 py-1 rounded-full ${getDifficultyColor(entry.difficulty)} border font-medium`}>
                                {entry.skill}
                              </span>
                              <span className={`text-sm px-2 py-1 rounded-full ${getDifficultyColor(entry.difficulty)} border`}>
                                {entry.difficulty}
                              </span>
                              {entry.is_completed ? (
                                <span className="text-sm px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-400/30">
                                  ✅ Completed
                                </span>
                              ) : (
                                <span className="text-sm px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full border border-amber-400/30">
                                  ⏸️ Partial
                                </span>
                              )}
                            </div>
                            <div className={`text-sm ${themeColors.textSecondary} mt-1`}>
                              {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(entry.avg_score)}`}>
                            {entry.avg_score.toFixed(1)}/10
                          </div>
                          <div className={`text-sm ${themeColors.textSecondary}`}>
                            {entry.questions_attempted} questions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
