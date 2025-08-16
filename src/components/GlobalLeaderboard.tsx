'use client';

import React from 'react';
import Link from 'next/link';
// ✅ ADDED: Theme imports
import { useTheme } from '@/hooks/useTheme';

interface LeaderboardEntry {
  id: number;
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  user_username: string;
  skill: string;
  difficulty: string;
  total_score: number;
  avg_score: number;
  questions_attempted: number;
  global_rank: number;
  interview_count: number;
  created_at: string;
}

interface GlobalLeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export default function GlobalLeaderboard({ entries, loading = false }: GlobalLeaderboardProps) {
  // ✅ ADDED: Global theme
  const { themeColors, isDark } = useTheme();

  const safeNumber = (num: any): number => {
    const parsed = Number(num);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeToFixed = (num: any, digits = 1): string => {
    const parsed = Number(num);
    return isNaN(parsed) ? '0.0' : parsed.toFixed(digits);
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
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

  if (loading) {
    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-6 ${themeColors.cardBorder} border shadow-xl`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-600/30 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-600/20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-12 text-center ${themeColors.cardBorder} border shadow-xl`}>
        <div className="text-6xl mb-4">🏆</div>
        <h3 className={`text-2xl font-bold ${themeColors.text} mb-4`}>
          Be the first to complete an interview and claim the top spot!
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
      <div className="p-6 border-b ${themeColors.cardBorder}">
        <h2 className={`text-2xl font-bold ${themeColors.text} flex items-center`}>
          <span className="mr-3">🌍</span>
          Top performers across all skills and difficulties
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`${themeColors.cardBg} border-b ${themeColors.cardBorder}`}>
              <th className={`text-left py-4 px-6 font-semibold ${themeColors.text}`}>Rank</th>
              <th className={`text-left py-4 px-6 font-semibold ${themeColors.text}`}>User</th>
              <th className={`text-left py-4 px-6 font-semibold ${themeColors.text}`}>Skill & Level</th>
              <th className={`text-left py-4 px-6 font-semibold ${themeColors.text}`}>Score</th>
              <th className={`text-left py-4 px-6 font-semibold ${themeColors.text}`}>Questions</th>
              <th className={`text-left py-4 px-6 font-semibold ${themeColors.text}`}>Interviews</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                className={`border-b ${themeColors.cardBorder} hover:bg-white/5 transition-all duration-200 ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-yellow-600/5' : ''
                }`}
              >
                {/* Rank */}
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getMedalEmoji(entry.global_rank)}</span>
                    <span className={`font-bold text-lg ${themeColors.text}`}>
                      #{entry.global_rank}
                    </span>
                  </div>
                </td>

                {/* User */}
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${themeColors.accent} flex items-center justify-center text-white font-bold`}>
                      {(entry.user_first_name || entry.user_username || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={`font-medium ${themeColors.text}`}>
                        {entry.user_first_name || entry.user_username || 'Anonymous'}
                      </div>
                      <div className={`text-sm ${themeColors.textSecondary}`}>
                        ID: {entry.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>

                {/* Skill & Level */}
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <div className={`font-medium ${themeColors.text}`}>
                      {entry.skill}
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(entry.difficulty)}`}>
                      {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                    </span>
                  </div>
                </td>

                {/* Score */}
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <div className={`text-xl font-bold ${
                      safeNumber(entry.avg_score) >= 8 ? 'text-green-400' : 
                      safeNumber(entry.avg_score) >= 6 ? 'text-amber-400' : 
                      'text-red-400'
                    }`}>
                      {safeToFixed(entry.avg_score)}/10
                    </div>
                    <div className={`text-sm ${themeColors.textSecondary}`}>
                      Total: {safeNumber(entry.total_score)}
                    </div>
                  </div>
                </td>

                {/* Questions */}
                <td className="py-4 px-6">
                  <div className={`text-center ${themeColors.text}`}>
                    <div className="font-medium">{entry.questions_attempted}</div>
                    <div className={`text-sm ${themeColors.textSecondary}`}>attempted</div>
                  </div>
                </td>

                {/* Interviews */}
                <td className="py-4 px-6">
                  <div className={`text-center ${themeColors.text}`}>
                    <div className="font-medium">{entry.interview_count}</div>
                    <div className={`text-sm ${themeColors.textSecondary}`}>completed</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length > 10 && (
        <div className={`p-4 border-t ${themeColors.cardBorder} text-center`}>
          <p className={`${themeColors.textSecondary} text-sm`}>
            Showing top 10 performers. Complete an interview to see your ranking!
          </p>
        </div>
      )}
    </div>
  );
}
