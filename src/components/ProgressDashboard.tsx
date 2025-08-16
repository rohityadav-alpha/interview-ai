'use client';

import React, { useState, useEffect } from 'react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useTheme } from '@/hooks/useTheme';

interface ProgressMetric {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend: 'up' | 'down' | 'neutral';
}

interface InterviewData {
  id: number;
  skill: string;
  avg_score: number;
  total_score: number;
  is_completed: boolean;
  created_at: string;
}

export default function ProgressDashboard() {
  const { themeColors, isDark } = useTheme();
  const { userId, isAuthenticated } = useCustomAuth();
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && isAuthenticated) {
      fetchProgressData();
    } else {
      setLoading(false);
    }
  }, [userId, isAuthenticated]);

  // ✅ FIXED: Enhanced fetch with proper error handling and data validation
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      // ✅ CRITICAL FIX: Validate and extract correct data format
      let interviews: InterviewData[] = [];

      if (data.success) {
        // API returns { success: true, personalStats: [...] }
        if (Array.isArray(data.personalStats)) {
          interviews = data.personalStats;
        } else if (Array.isArray(data.globalLeaderboard)) {
          interviews = data.globalLeaderboard;
        } else if (Array.isArray(data)) {
          interviews = data;
        }
      } else if (Array.isArray(data)) {
        // Direct array response
        interviews = data;
      }

      // ✅ FIXED: Call calculateMetrics with validated array
      calculateMetrics(interviews);

    } catch (error: any) {
      setError(error.message || 'Failed to fetch progress data');
      // ✅ Set default metrics on error
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Enhanced calculateMetrics with array validation
  const calculateMetrics = (interviews: InterviewData[]) => {
    // ✅ CRITICAL FIX: Ensure interviews is an array
    if (!Array.isArray(interviews)) {
      interviews = [];
    }

    const totalInterviews = interviews.length;
    const avgScore = totalInterviews > 0
      ? Math.round(interviews.reduce((sum, item) => sum + (item.avg_score || 0), 0) / totalInterviews * 10) / 10
      : 0;
    const skillsCount = new Set(interviews.map(item => item.skill || 'Unknown')).size;
    const bestScore = Math.max(...interviews.map(i => i.total_score || 0), 0);

    const calculatedMetrics: ProgressMetric[] = [
      {
        title: 'Total Interviews',
        value: totalInterviews.toString(),
        change: totalInterviews > 0 ? 'Keep it up!' : 'Start your journey',
        icon: '📝',
        color: 'blue',
        trend: 'up'
      },
      {
        title: 'Average Score',
        value: `${avgScore}/10`,
        change: avgScore > 7 ? 'Excellent!' : 'Keep improving',
        icon: '⭐',
        color: 'green',
        trend: 'up'
      },
      {
        title: 'Skills Practiced',
        value: skillsCount.toString(),
        change: skillsCount > 3 ? 'Great variety!' : 'Try more skills',
        icon: '🎯',
        color: 'purple',
        trend: 'up'
      },
      {
        title: 'Best Score',
        value: `${bestScore}/100`,
        change: 'Personal best',
        icon: '🏆',
        color: 'orange',
        trend: 'up'
      }
    ];

    setMetrics(calculatedMetrics);
    };

  const MetricCard = ({ metric }: { metric: ProgressMetric }) => {
    const colorClasses = {
      blue: 'from-blue-600/20 to-blue-700/20 border-blue-400/30 text-blue-300',
      green: 'from-green-600/20 to-green-700/20 border-green-400/30 text-green-300',
      purple: 'from-purple-600/20 to-purple-700/20 border-purple-400/30 text-purple-300',
      orange: 'from-orange-600/20 to-orange-700/20 border-orange-400/30 text-orange-300'
    };

    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-6 ${themeColors.cardBorder} border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`text-3xl group-hover:scale-110 transition-transform duration-300`}>
            {metric.icon}
          </div>
          <div className={`text-lg ${
            metric.trend === 'up' ? 'text-green-400' : 
            metric.trend === 'down' ? 'text-red-400' : 
            'text-gray-400'
          }`}>
            {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className={`font-semibold ${themeColors.text} text-lg`}>
            {metric.title}
          </h3>
          <div className={`text-3xl font-bold ${themeColors.text} mb-2`}>
            {metric.value}
          </div>
          <p className={`text-sm ${themeColors.textSecondary}`}>
            {metric.change}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 h-2 bg-gray-700/30 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colorClasses[metric.color]} rounded-full transition-all duration-1000 ease-out`}
            style={{ 
              width: metric.title === 'Average Score' ? `${(parseFloat(metric.value.split('/')[0]) / 10) * 100}%` :
                     metric.title === 'Best Score' ? `${(parseFloat(metric.value.split('/')[0]) / 100) * 100}%` :
                     '75%'
            }}
          />
        </div>
      </div>
    );
  };

  // ✅ FIXED: Enhanced loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-6 ${themeColors.cardBorder} border shadow-xl animate-pulse`}>
            <div className="space-y-4">
              <div className="h-8 bg-gray-600/30 rounded w-8"></div>
              <div className="h-6 bg-gray-600/30 rounded w-3/4"></div>
              <div className="h-8 bg-gray-600/30 rounded w-1/2"></div>
              <div className="h-4 bg-gray-600/30 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ✅ FIXED: Enhanced error state
  if (error) {
    return (
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-8 ${themeColors.cardBorder} border shadow-xl text-center`}>
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className={`text-xl font-bold ${themeColors.text} mb-4`}>
          Failed to Load Progress Data
        </h3>
        <p className={`${themeColors.textSecondary} mb-6`}>{error}</p>
        <button
          onClick={fetchProgressData}
          className={`px-6 py-3 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-medium hover:scale-105 transition-all duration-200`}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Progress Chart Placeholder */}
      <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-8 ${themeColors.cardBorder} border shadow-xl`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className={`text-2xl font-bold ${themeColors.text} mb-4`}>
            Score Progress
          </h3>
          {metrics.length > 0 && metrics[0].value !== '0' ? (
            <div className={`${themeColors.textSecondary} space-y-4`}>
              <p>Your interview performance is being tracked!</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className={`${themeColors.cardBg} p-4 rounded-xl ${themeColors.cardBorder} border`}>
                  <div className={`text-lg font-bold ${themeColors.text}`}>
                    {metrics.find(m => m.title === 'Total Interviews')?.value || '0'}
                  </div>
                  <div className="text-sm text-blue-300">Interviews</div>
                </div>
                <div className={`${themeColors.cardBg} p-4 rounded-xl ${themeColors.cardBorder} border`}>
                  <div className={`text-lg font-bold ${themeColors.text}`}>
                    {metrics.find(m => m.title === 'Average Score')?.value || '0/10'}
                  </div>
                  <div className="text-sm text-green-300">Avg Score</div>
                </div>
                <div className={`${themeColors.cardBg} p-4 rounded-xl ${themeColors.cardBorder} border`}>
                  <div className={`text-lg font-bold ${themeColors.text}`}>
                    {metrics.find(m => m.title === 'Skills Practiced')?.value || '0'}
                  </div>
                  <div className="text-sm text-purple-300">Skills</div>
                </div>
              </div>
            </div>
          ) : (
            <p className={`${themeColors.textSecondary} text-lg`}>
              Complete more interviews to see your progress chart
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
