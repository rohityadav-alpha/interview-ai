"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ THEME IMPORTS
import { useTheme } from "@/hooks/useTheme";
import ThemeToggle from "@/components/ThemeToggle";

export default function ReportDetail() {
  // ✅ THEME HOOK
  const { themeColors, isDark } = useTheme();

  const params = useSearchParams();
  const router = useRouter();
  const interview_id = params.get("interview_id");
  const { user, isLoaded } = useUser();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user_email = user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    if (!isLoaded || !user_email || !interview_id) return;

    setLoading(true);
    setError("");

    fetch(
      `/api/report?interview_id=${interview_id}&user_email=${encodeURIComponent(
        user_email
      )}`
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load report details");
        setLoading(false);
      });
  }, [isLoaded, user_email, interview_id]);

  const generatePDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // PAGE 1: Header & Basic Info
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Interview Report", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text(`Interview ID: ${interview_id}`, 20, 40);
    doc.text(
      `Candidate: ${data.meta?.user_first_name || ""} ${
        data.meta?.user_last_name || ""
      }`,
      20,
      50
    );
    doc.text(
      `Date: ${new Date(data.meta?.created_at).toLocaleDateString()}`,
      20,
      60
    );
    doc.text(`Skill: ${data.meta?.skill}`, 20, 70);
    doc.text(`Total Score: ${data.meta?.total_score}%`, 20, 80);
    doc.text(`Average Score: ${data.meta?.avg_score}`, 20, 90);

    // Questions Table - No truncation!
    const tableData =
      data.questions?.map((q, index) => [
        index + 1,
        q.question,
        q.user_answer || "No answer",
        q.ai_score || "N/A",
        q.ai_feedback || "No feedback",
      ]) || [];

    autoTable(doc, {
      head: [["#", "Question", "Answer", "Score", "AI Feedback"]],
      body: tableData,
      startY: 105,
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [41, 128, 185], fontSize: 8, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 65 },
        2: { cellWidth: 55 },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 45 },
      },
      margin: { top: 20, bottom: 20 },
    });

    // PAGE 2: Improvements & Confidence Tips
    doc.addPage();
    let yPosition = 30;

    const uniqueImprovements = data.meta?.improvements
      ? [
          ...new Set(
            data.meta.improvements
              .split(";")
              .map((s) => s.trim())
              .filter(Boolean)
          ),
        ]
      : [];
    if (uniqueImprovements.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("📈 Areas for Improvement", 20, yPosition);
      yPosition += 15;
      doc.setFontSize(10);
      doc.setTextColor(60);
      uniqueImprovements.forEach((improvement, index) => {
        const lines = doc.splitTextToSize(
          `${index + 1}. ${improvement}`,
          pageWidth - 40
        );
        lines.forEach((line) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 30;
          }
          doc.text(line, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 4;
      });
      yPosition += 15;
    }

    const uniqueConfidenceTips = data.meta?.confidence_tips
      ? [
          ...new Set(
            data.meta.confidence_tips
              .split(";")
              .map((s) => s.trim())
              .filter(Boolean)
          ),
        ]
      : [];
    if (uniqueConfidenceTips.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 30;
      }
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("🚀 Confidence Building Tips", 20, yPosition);
      yPosition += 15;
      doc.setFontSize(10);
      doc.setTextColor(60);
      uniqueConfidenceTips.forEach((tip, index) => {
        const lines = doc.splitTextToSize(
          `${index + 1}. ${tip}`,
          pageWidth - 40
        );
        lines.forEach((line) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 30;
          }
          doc.text(line, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 4;
      });
    }

    doc.save(`Interview-Report-${interview_id}.pdf`);
  };

  // ✅ ENHANCED THEME COLORS
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

  if (!isLoaded || loading) {
    return (
      <div
        className={`min-h-screen ${themeColors.bg} ${themeColors.text} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-lg font-medium mb-2">Analyzing Interview Report</p>
          <p className={`text-sm ${themeColors.mutedText}`}>
            Please wait while we load your detailed analysis...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={`min-h-screen ${themeColors.bg} ${themeColors.text} flex items-center justify-center`}
      >
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
          <p className={`text-lg mb-6 ${themeColors.mutedText}`}>
            {error || "The requested interview report could not be found."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/reports")}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-medium"
            >
              ← Back to All Reports
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className={`w-full px-6 py-3 ${themeColors.cardBg} ${themeColors.border} border hover:bg-opacity-80 rounded-xl transition-all duration-300 font-medium`}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const interview = data.meta || {};
  const questions = data.questions || [];
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter((q) => q.user_answer).length;
  const totalScore = questions.reduce(
    (sum, q) => sum + (parseInt(q.ai_score) || 0),
    0
  );
  const averageScore =
    totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;

    // DEDUPLICATE IMPROVEMENTS & CONFIDENCE TIPS FOR UI
  const uniqueImprovements = interview.improvements 
    ? [...new Set(interview.improvements.split(';').map(s => s.trim()).filter(Boolean))]
    : [];
    
  const uniqueConfidenceTips = interview.confidence_tips 
    ? [...new Set(interview.confidence_tips.split(';').map(s => s.trim()).filter(Boolean))]
    : [];

  return (
    <div className={`min-h-screen ${themeColors.bg} ${themeColors.text}`}>
      {/* Enhanced Header */}
      <div
        className={`${themeColors.cardBg} backdrop-blur-md ${themeColors.cardBorder} border-b shadow-xl sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/reports")}
                className={`px-8 py-4 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-2xl font-bold transition-all duration-200 ${themeColors.cardBorder} border shadow-lg`}
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">
                  Back
                </span>
              </button>
              <button
                onClick={() => router.push("/")}
                className={`px-8 py-4 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-2xl font-bold transition-all duration-200 ${themeColors.cardBorder} border shadow-lg`}
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">
                  Home
                </span>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Interview Analysis Report
                </h1>
                <p className={`text-sm ${themeColors.mutedText}`}>
                  Interview #{interview_id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={generatePDF}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
              >
                <span className="text-lg">📄</span>
                <span className="font-medium">Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`${themeColors.cardBg} ${themeColors.border} border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">
                {getScoreIcon(interview.total_score || 0)}
              </div>
              <div
                className={`text-3xl font-bold mb-2 ${
                  getScoreColor(interview.total_score || 0).split(" ")[0]
                }`}
              >
                {interview.total_score || 0}%
              </div>
              <div className={`text-sm font-medium ${themeColors.mutedText}`}>
                Final Score
              </div>
            </div>
          </div>

          <div
            className={`${themeColors.cardBg} ${themeColors.border} border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <div
                className={`text-3xl font-bold mb-2 ${
                  getScoreColor(averageScore).split(" ")[0]
                }`}
              >
                {averageScore}
              </div>
              <div className={`text-sm font-medium ${themeColors.mutedText}`}>
                Average Score
              </div>
            </div>
          </div>

          <div
            className={`${themeColors.cardBg} ${themeColors.border} border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">❓</div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {answeredQuestions}/{totalQuestions}
              </div>
              <div className={`text-sm font-medium ${themeColors.mutedText}`}>
                Questions
              </div>
            </div>
          </div>

          <div
            className={`${themeColors.cardBg} ${themeColors.border} border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {interview.skill}
              </div>
              <div className={`text-sm font-medium ${themeColors.mutedText}`}>
                Skill Category
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Interview Info */}
        <div
          className={`${themeColors.cardBg} ${themeColors.border} border rounded-2xl p-8 mb-8 backdrop-blur-sm`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-2xl">👤</span>
            <h2 className="text-2xl font-bold">Interview Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className={`${themeColors.cardBg} ${themeColors.border} border rounded-xl p-4`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl">👨‍💼</span>
                <span
                  className={`text-sm font-medium ${themeColors.mutedText}`}
                >
                  Candidate
                </span>
              </div>
              <p className="font-bold text-lg">
                {interview.user_first_name} {interview.user_last_name}
              </p>
            </div>
            <div
              className={`${themeColors.cardBg} ${themeColors.border} border rounded-xl p-4`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl">📅</span>
                <span
                  className={`text-sm font-medium ${themeColors.mutedText}`}
                >
                  Interview Date
                </span>
              </div>
              <p className="font-bold text-lg">
                {new Date(interview.created_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div
              className={`${themeColors.cardBg} ${themeColors.border} border rounded-xl p-4`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl">🆔</span>
                <span
                  className={`text-sm font-medium ${themeColors.mutedText}`}
                >
                  Interview ID
                </span>
              </div>
              <p className="font-bold text-lg">#{interview_id}</p>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mt-6 p-4 bg-gradient-to-r  dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Completion Progress</span>
              <span className="font-bold">
                {Math.round((answeredQuestions / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(answeredQuestions / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {answeredQuestions} Answered
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm">
                  {totalQuestions - answeredQuestions} Skipped
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Questions and Answers */}
        <div
          className={`${themeColors.cardBg} ${themeColors.border} border rounded-2xl p-8 backdrop-blur-sm`}
        >
          <div className="flex items-center space-x-3 mb-8">
            <span className="text-2xl">💬</span>
            <h2 className="text-2xl font-bold">Questions & Responses</h2>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">📝</div>
              <h3 className="text-xl font-bold mb-3">No Questions Found</h3>
              <p className={`${themeColors.mutedText} text-lg`}>
                This interview doesn't contain any questions yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`${themeColors.border} border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-blue-0/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full mr-4">
                          Q{index + 1}
                        </span>
                        {question.ai_score && (
                          <span
                            className={`text-sm font-bold px-3 py-1 rounded-full border-2 ${getScoreColor(
                              parseInt(question.ai_score)
                            )} flex items-center space-x-1`}
                          >
                            <span>
                              {getScoreIcon(parseInt(question.ai_score))}
                            </span>
                            <span>{question.ai_score}/10</span>
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-lg mb-4 leading-relaxed">
                        {question.question}
                      </p>
                    </div>
                  </div>

                  {question.user_answer ? (
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">💭</span>
                        <h4
                          className={`text-sm font-bold ${themeColors.mutedText} uppercase tracking-wide`}
                        >
                          Your Answer
                        </h4>
                      </div>
                      <div
                        className={`${themeColors.cardBg} ${themeColors.border} border-2 p-4 rounded-xl bg-gradient-to-r `}
                      >
                        <p className="leading-relaxed">
                          {question.user_answer}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">⏭️</span>
                        <p className="text-gray-500 italic font-medium">
                          Question was skipped
                        </p>
                      </div>
                    </div>
                  )}

                  {question.ai_feedback && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">🤖</span>
                        <h4
                          className={`text-sm font-bold ${themeColors.mutedText} uppercase tracking-wide`}
                        >
                          AI Analysis & Feedback
                        </h4>
                      </div>
                      <div
                        className={`${themeColors.accent} bg-opacity-10 border-2 ${themeColors.border} p-4 rounded-xl bg-gradient-to-r`}
                      >
                        <p className="leading-relaxed">
                          {question.ai_feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <br />
        {/* IMPROVEMENTS & CONFIDENCE TIPS */}
        {(uniqueImprovements.length > 0 || uniqueConfidenceTips.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {uniqueImprovements.length > 0 && (
              <div className={`${isDark ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border-blue-400/30' : 'bg-white/80 backdrop-blur-xl border-blue-200'} border rounded-2xl p-6`}>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Areas for Improvement
                </h3>
                <div className={`${isDark ? 'bg-orange-500/10 border-orange-400/30' : 'bg-orange-50 border-orange-200'} p-4 rounded-lg border`}>
                  <ul className="space-y-2">
                    {uniqueImprovements.map((improvement, index) => (
                      <li key={index} className={`flex items-start gap-2 text-sm ${isDark ? 'text-orange-200' : 'text-orange-800'}`}>
                        <span className={`${isDark ? 'text-orange-400' : 'text-orange-600'} mt-1 font-bold`}>{index + 1}.</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {uniqueConfidenceTips.length > 0 && (
              <div className={`${isDark ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border-blue-400/30' : 'bg-white/80 backdrop-blur-xl border-green-200'} border rounded-2xl p-6`}>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Confidence Building Tips
                </h3>
                <div className={`${isDark ? 'bg-green-500/10 border-green-400/30' : 'bg-green-50 border-green-200'} p-4 rounded-lg border`}>
                  <ul className="space-y-2">
                    {uniqueConfidenceTips.map((tip, index) => (
                      <li key={index} className={`flex items-start gap-2 text-sm ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                        <span className={`${isDark ? 'text-green-400' : 'text-green-600'} mt-1 font-bold`}>{index + 1}.</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
