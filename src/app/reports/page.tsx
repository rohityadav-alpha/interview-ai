'use client';

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
// ✅ THEME IMPORTS
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';

export default function InterviewHistory() {
  // ✅ THEME HOOK
  const { themeColors, isDark } = useTheme();
  
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const user_email = user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    if (!isLoaded || !user_email) return;
    
    setLoading(true);
    setError('');
    
    fetch(`/api/user-interviews?user_email=${encodeURIComponent(user_email)}`)
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(Array.isArray(res.interviews) ? res.interviews : []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load interview history');
        setLoading(false);
      });
  }, [isLoaded, user_email]);

  // Filter and sort data
  const filteredData = data
    .filter(row => {
      const matchesSearch = !searchTerm || 
        row.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${row.user_first_name} ${row.user_last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSkill = skillFilter === 'all' || row.skill === skillFilter;
      
      return matchesSearch && matchesSkill;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score_desc':
          return (b.final_score || 0) - (a.final_score || 0);
        case 'score_asc':
          return (a.final_score || 0) - (b.final_score || 0);
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'date_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  // Get unique skills for filter
  const uniqueSkills = [...new Set(data.map(row => row.skill).filter(Boolean))];

  // Calculate stats
  const stats = {
    totalInterviews: data.length,
    averageScore: data.length ? (data.reduce((sum, row) => sum + (row.final_score || 0), 0) / data.length).toFixed(1) : 0,
    bestScore: data.length ? Math.max(...data.map(row => row.final_score || 0)) : 0,
    skillsCount: uniqueSkills.length
  };

  // ✅ THEME ADAPTIVE COLORS
  const getScoreColor = (score) => {
    if (isDark) {
      if (score >= 80) return 'text-green-400 bg-green-500/20 border-green-400/30';
      if (score >= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      return 'text-red-400 bg-red-500/20 border-red-400/30';
    } else {
      if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
      if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  if (!isLoaded) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isDark ? 'border-purple-200 border-t-purple-600' : 'border-blue-200 border-t-blue-600'} mx-auto mb-4`}></div>
          <p className={isDark ? 'text-purple-200' : 'text-gray-600'}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* ✅ TOP BAR: Home Button + Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/')}
            className={`inline-flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-white/10 border-white/20 text-purple-200 hover:bg-white/20' : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-white'} border rounded-xl transition-all duration-300 backdrop-blur-sm`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            🏠 Home
          </button>
          
          {/* ✅ THEME TOGGLE */}
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-5xl md:text-6xl font-bold ${isDark ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'} bg-clip-text text-transparent mb-6`}>
            Interview History 📊
          </h1>
          <p className={`text-xl ${isDark ? 'text-purple-200' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Track your AI interview performance and progress over time.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className={`${isDark ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border-blue-400/30' : 'bg-white/80 backdrop-blur-xl border-blue-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-blue-300' : 'text-blue-600'} text-sm font-medium mb-2`}>Total Interviews</p>
                <p className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
                  {stats.totalInterviews}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border-green-400/30' : 'bg-white/80 backdrop-blur-xl border-green-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-green-300' : 'text-green-600'} text-sm font-medium mb-2`}>Average Score</p>
                <p className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-green-600 to-emerald-600'} bg-clip-text text-transparent`}>
                  {stats.averageScore}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-xl border-yellow-400/30' : 'bg-white/80 backdrop-blur-xl border-yellow-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-yellow-300' : 'text-yellow-600'} text-sm font-medium mb-2`}>Best Score</p>
                <p className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-yellow-600 to-orange-600'} bg-clip-text text-transparent`}>
                  {stats.bestScore}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border-purple-400/30' : 'bg-white/80 backdrop-blur-xl border-purple-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-purple-300' : 'text-purple-600'} text-sm font-medium mb-2`}>Skills Practiced</p>
                <p className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-purple-600 to-pink-600'} bg-clip-text text-transparent`}>
                  {stats.skillsCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${isDark ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white/80 backdrop-blur-xl border-white/40'} border rounded-2xl p-6 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 ${isDark ? 'text-purple-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by skill or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-purple-300' : 'bg-white/60 border-gray-200 text-gray-900 placeholder-gray-500'} border rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors backdrop-blur-sm`}
              />
            </div>
            
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className={`w-full px-4 py-3 ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white/60 border-gray-200 text-gray-900'} border rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors backdrop-blur-sm`}
            >
              <option value="all" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>All Skills</option>
              {uniqueSkills.map(skill => (
                <option key={skill} value={skill} className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>{skill}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`w-full px-4 py-3 ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white/60 border-gray-200 text-gray-900'} border rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors backdrop-blur-sm`}
            >
              <option value="date_desc" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Newest First</option>
              <option value="date_asc" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Oldest First</option>
              <option value="score_desc" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Highest Score</option>
              <option value="score_asc" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Lowest Score</option>
            </select>
          </div>
        </div>

        {/* Interview List */}
        <div className={`${isDark ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white/80 backdrop-blur-xl border-white/40'} border rounded-2xl overflow-hidden`}>
          <div className={`px-6 py-4 ${isDark ? 'border-white/20' : 'border-gray-200'} border-b`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <svg className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1h3z" />
              </svg>
              Your Interviews ({filteredData.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isDark ? 'border-purple-200 border-t-purple-600' : 'border-blue-200 border-t-blue-600'} mx-auto mb-4`}></div>
              <p className={isDark ? 'text-purple-200' : 'text-gray-600'}>Loading interviews...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.19 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 ${isDark ? 'bg-purple-500/20' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <svg className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-purple-200' : 'text-gray-800'} mb-2`}>
                {data.length === 0 ? 'No interviews yet' : 'No interviews match your filters'}
              </h3>
              <p className={`${isDark ? 'text-purple-300' : 'text-gray-600'} mb-4`}>
                {data.length === 0 ? 'Start your first AI interview to see results here.' : 'Try adjusting your search or filters.'}
              </p>
              {data.length === 0 && (
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  Start Interview
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border-b`}>
                    <tr>
                      <th className={`text-left py-4 px-6 font-semibold ${isDark ? 'text-purple-200' : 'text-gray-700'}`}>Interview ID</th>
                      <th className={`text-left py-4 px-6 font-semibold ${isDark ? 'text-purple-200' : 'text-gray-700'}`}>Name</th>
                      <th className={`text-left py-4 px-6 font-semibold ${isDark ? 'text-purple-200' : 'text-gray-700'}`}>Skill</th>
                      <th className={`text-left py-4 px-6 font-semibold ${isDark ? 'text-purple-200' : 'text-gray-700'}`}>Date</th>
                      <th className={`text-left py-4 px-6 font-semibold ${isDark ? 'text-purple-200' : 'text-gray-700'}`}>Score</th>
                      <th className={`text-left py-4 px-6 font-semibold ${isDark ? 'text-purple-200' : 'text-gray-700'}`}>Avg</th>
                      <th className={`text-left py-4 px-6 font-semibold ${isDark ? 'text-purple-200' : 'text-gray-700'}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className={`${isDark ? 'divide-white/10' : 'divide-gray-200'} divide-y`}>
                    {filteredData.map((row, index) => (
                      <tr key={row.interview_id || index} className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="py-4 px-6">
                          <span className={`inline-block ${isDark ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 border-blue-400/30' : 'bg-blue-50 text-blue-600 border-blue-200'} text-xs font-mono px-2 py-1 rounded-full border`}>
                            #{row.interview_id}
                          </span>
                        </td>
                        <td className={`py-4 px-6 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {row.user_first_name} {row.user_last_name}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 border-purple-400/30' : 'bg-purple-50 text-purple-600 border-purple-200'} text-xs font-medium px-2 py-1 rounded-full border`}>
                            {row.skill}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-sm ${isDark ? 'text-purple-200' : 'text-gray-600'}`}>
                          <div>{new Date(row.created_at).toLocaleDateString()}</div>
                          <div className={`text-xs ${isDark ? 'text-purple-400' : 'text-gray-500'}`}>
                            {new Date(row.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(row.final_score)} backdrop-blur-sm`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {row.final_score}%
                          </span>
                        </td>
                        <td className={`py-4 px-6 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {row.avg_score}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => router.push(`/reports/detail?interview_id=${row.interview_id}`)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className={`md:hidden ${isDark ? 'divide-white/10' : 'divide-gray-200'} divide-y`}>
                {filteredData.map((row, index) => (
                  <div key={row.interview_id || index} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-block ${isDark ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 border-blue-400/30' : 'bg-blue-50 text-blue-600 border-blue-200'} text-xs font-mono px-2 py-1 rounded-full border`}>
                        #{row.interview_id}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(row.final_score)} backdrop-blur-sm`}>
                        {row.final_score}%
                      </span>
                    </div>
                    
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {row.user_first_name} {row.user_last_name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDark ? 'text-purple-300' : 'text-gray-600'}>Skill:</span>
                        <span className={`inline-block ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 border-purple-400/30' : 'bg-purple-50 text-purple-600 border-purple-200'} text-xs font-medium px-2 py-1 rounded-full border`}>
                          {row.skill}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDark ? 'text-purple-300' : 'text-gray-600'}>Date:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                          {new Date(row.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDark ? 'text-purple-300' : 'text-gray-600'}>Average:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.avg_score}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/reports/detail?interview_id=${row.interview_id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
