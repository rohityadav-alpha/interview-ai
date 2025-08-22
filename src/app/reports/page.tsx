"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// ✅ THEME IMPORTS
import { useTheme } from "@/hooks/useTheme";
import ThemeToggle from "@/components/ThemeToggle";

export default function InterviewHistory() {
  // ✅ THEME HOOK
  const { themeColors, isDark } = useTheme();

  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  const user_email = user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    if (!isLoaded || !user_email) return;

    setLoading(true);
    setError("");

    fetch(`/api/user-interviews?user_email=${encodeURIComponent(user_email)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(Array.isArray(res.interviews) ? res.interviews : []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load interview history");
        setLoading(false);
      });
  }, [isLoaded, user_email]);

  // Filter and sort data
  const filteredData = data
    .filter((row) => {
      const matchesSearch =
        !searchTerm ||
        row.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${row.user_first_name} ${row.user_last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesSkill = skillFilter === "all" || row.skill === skillFilter;
      return matchesSearch && matchesSkill;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "score_desc":
          return (b.final_score || 0) - (a.final_score || 0);
        case "score_asc":
          return (a.final_score || 0) - (b.final_score || 0);
        case "date_asc":
          return new Date(a.created_at) - new Date(b.created_at);
        case "date_desc":
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  // Get unique skills for filter
  const uniqueSkills = [
    ...new Set(data.map((row) => row.skill).filter(Boolean)),
  ];

  // Calculate stats
  const stats = {
    totalInterviews: data.length,
    averageScore: data.length
      ? (
          data.reduce((sum, row) => sum + (row.final_score || 0), 0) /
          data.length
        ).toFixed(1)
      : 0,
    bestScore: data.length
      ? Math.max(...data.map((row) => row.final_score || 0))
      : 0,
    skillsCount: uniqueSkills.length,
  };

  // ✅ ENHANCED THEME COLORS (Same as Detail Page)
  const getScoreColor = (score) => {
    if (isDark) {
      if (score >= 80)
        return "text-emerald-400 bg-emerald-500/20 border-emerald-400/30";
      if (score >= 60)
        return "text-amber-400 bg-amber-500/20 border-amber-400/30";
      return "text-rose-400 bg-rose-500/20 border-rose-400/30";
    } else {
      if (score >= 80)
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
      return "text-rose-600 bg-rose-50 border-rose-200";
    }
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return "🏆";
    if (score >= 60) return "⭐";
    return "💪";
  };

  if (!isLoaded) {
    return (
      <div
        className={`min-h-screen ${themeColors.bg} ${themeColors.text} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeColors.bg} ${themeColors.text}`}>
      {/* Enhanced Header with Gradient Background */}
      <div
        className={`${themeColors.cardBg} backdrop-blur-md ${themeColors.cardBorder} border-b shadow-xl sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className={`px-8 py-4 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-2xl font-bold transition-all duration-200 ${themeColors.cardBorder} border shadow-lg`}
                >
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-lg">
                   Dashboard
                  </span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Interview Performance Reports
                  </h1>
                  <p className={`text-base ${themeColors.mutedText} mt-1`}>
                    Track your AI interview performance and progress over time.
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid with Better Shadows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`${themeColors.cardBg} ${themeColors.border} border-b shadow-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🎯</div>
              <div className="text-4xl font-black text-blue-600 mb-2 drop-shadow-sm">
                {stats.totalInterviews}
              </div>
              <div
                className={`text-sm font-bold ${themeColors.mutedText} uppercase tracking-wide`}
              >
                Total Interviews
              </div>
            </div>
          </div>

          <div
            className={`${themeColors.cardBg} ${themeColors.border} border-b shadow-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-br`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">📊</div>
              <div
                className={`text-4xl font-black mb-2 drop-shadow-sm ${
                  getScoreColor(stats.averageScore).split(" ")[0]
                }`}
              >
                {stats.averageScore}%
              </div>
              <div
                className={`text-sm font-bold ${themeColors.mutedText} uppercase tracking-wide`}
              >
                Average Score
              </div>
            </div>
          </div>

          <div
            className={`${themeColors.cardBg} ${themeColors.border} border-b shadow-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-br`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">
                {getScoreIcon(stats.bestScore)}
              </div>
              <div
                className={`text-4xl font-black mb-2 drop-shadow-sm ${
                  getScoreColor(stats.bestScore).split(" ")[0]
                }`}
              >
                {stats.bestScore}%
              </div>
              <div
                className={`text-sm font-bold ${themeColors.mutedText} uppercase tracking-wide`}
              >
                Best Score
              </div>
            </div>
          </div>

          <div
            className={`${themeColors.cardBg} ${themeColors.border} border-b shadow-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-br`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🎨</div>
              <div className="text-4xl font-black text-purple-600 mb-2 drop-shadow-sm">
                {stats.skillsCount}
              </div>
              <div
                className={`text-sm font-bold ${themeColors.mutedText} uppercase tracking-wide`}
              >
                Skills Practiced
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters with Better Contrast */}
        <div
          className={`${themeColors.cardBg} ${themeColors.border} border-b shadow-xl rounded-2xl p-8 mb-8 backdrop-blur-sm shadow-lg bg-gradient-to-r`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">🔍</span>
            <h2 className="text-2xl font-bold">Filters & Search</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                className={`block text-sm font-bold ${themeColors.mutedText} border-b shadow-xl mb-3 uppercase tracking-wide`}
              >
                Search
              </label>
              <input
                type="text"
                placeholder="Search by skill or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-5 py-4 ${themeColors.cardBg} ${themeColors.border} border-b shadow-xl rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-md font-medium placeholder-gray-400`}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-bold ${themeColors.mutedText} border-b shadow-xl mb-3 uppercase tracking-wide`}
              >
                Skill Filter
              </label>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className={`w-full px-5 py-4 ${themeColors.cardBg} ${themeColors.border} border-b  rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-md font-medium`}
              >
                <option value="all" className="text-black ">All Skills</option>
                {uniqueSkills.map((skill) => (
                  <option key={skill} value={skill} className="text-black ">
                    {skill}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className={`block text-sm font-bold ${themeColors.mutedText} border-b shadow-xl mb-3 uppercase tracking-wide`}
              >
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full px-5 py-4 ${themeColors.cardBg} ${themeColors.border} border-b rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-md font-medium`}
              >
                <option value="date_desc" className="text-black">Latest First</option>
                <option value="date_asc" className="text-black">Oldest First</option>
                <option value="score_desc" className="text-black">Highest Score</option>
                <option value="score_asc" className="text-black">Lowest Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Content with Better Visibility */}
        <div
          className={`${themeColors.cardBg} ${themeColors.border} border-b rounded-2xl backdrop-blur-sm overflow-hidden shadow-xl`}
        >
          <div
            className={`p-6 border-b-1 ${themeColors.border} bg-gradient-to-r from-indigo-50/10 to-blue-50/10 dark:from-indigo-900/20 dark:to-blue-900/20`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📋</span>
                <h2 className="text-2xl font-bold">Interview History</h2>
              </div>
              <span
                className={`px-4 py-2 text-sm font-bold rounded-full ${themeColors.cardBg} ${themeColors.border} border-b shadow-md`}
              >
                {filteredData.length} results
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
              </div>
              <p className="text-xl font-bold">Loading interviews...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <div className="text-8xl mb-6">⚠️</div>
              <h3 className="text-2xl font-bold mb-4">Error Loading Data</h3>
              <p className={`${themeColors.mutedText} text-xl mb-8`}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-lg"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-8xl mb-6">📝</div>
              <h3 className="text-2xl font-bold mb-4">
                {data.length === 0 ? "No Interviews Yet" : "No Results Found"}
              </h3>
              <p className={`${themeColors.mutedText} text-xl mb-8`}>
                {data.length === 0
                  ? "Start your first AI interview to see results here."
                  : "Try adjusting your search or filters."}
              </p>
              {data.length === 0 && (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-lg"
                >
                  Start Your First Interview
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className={`${themeColors.cardBg} ${themeColors.border} border-b bg-gradient-to-r dark:from-slate-800 dark:to-gray-800`}
                >
                  <tr>
                    <th className="text-left p-6 font-black text-lg tracking-wide">
                      Interview ID
                    </th>
                    <th className="text-left p-6 font-black text-lg tracking-wide">
                      Name
                    </th>
                    <th className="text-left p-6 font-black text-lg tracking-wide">
                      Skill
                    </th>
                    <th className="text-left p-6 font-black text-lg tracking-wide">
                      Date
                    </th>
                    <th className="text-left p-6 font-black text-lg tracking-wide">
                      Score
                    </th>
                    <th className="text-left p-6 font-black text-lg tracking-wide">
                      Avg
                    </th>
                    <th className="text-left p-6 font-black text-lg tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr
                      key={row.interview_id}
                      className={`border-b ${themeColors.border} hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-300`}
                    >
                      <td className="p-6">
                        <span className="font-black text-base bg-gradient-to-r dark:from-gray-800 dark:to-slate-800  px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md">
                          #{row.interview_id}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                            {row.user_first_name?.[0] || "U"}
                          </div>
                          <span className="font-bold text-lg">
                            {row.user_first_name} {row.user_last_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-200 rounded-full text-sm font-bold border-2 border-blue-200 dark:border-blue-700 shadow-md">
                          {row.skill}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="text-base">
                          <div className="font-bold text-lg">
                            {new Date(row.created_at).toLocaleDateString()}
                          </div>
                          <div
                            className={`text-sm ${themeColors.mutedText} font-medium`}
                          >
                            {new Date(row.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span
                          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-base font-black border-2 shadow-lg ${getScoreColor(
                            row.final_score
                          )}`}
                        >
                          <span className="text-xl">
                            {getScoreIcon(row.final_score)}
                          </span>
                          <span>{row.final_score}%</span>
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="font-black text-lg">
                          {row.avg_score}
                        </span>
                      </td>
                      <td className="p-6">
                        <button
                          onClick={() =>
                            router.push(
                              `/reports/detail?interview_id=${row.interview_id}`
                            )
                          }
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 transform hover:scale-105 text-base font-bold shadow-lg hover:shadow-xl"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
