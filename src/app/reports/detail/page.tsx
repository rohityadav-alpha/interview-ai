'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// ✅ THEME IMPORTS
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';

export default function ReportDetail() {
  // ✅ THEME HOOK
  const { themeColors, isDark } = useTheme();
  
  const params = useSearchParams();
  const router = useRouter();
  const interview_id = params.get('interview_id');
  const { user, isLoaded } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user_email = user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    if (!isLoaded || !user_email || !interview_id) return;
    
    setLoading(true);
    setError('');
    
    fetch(`/api/report?interview_id=${interview_id}&user_email=${encodeURIComponent(user_email)}`)
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load report details');
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
    doc.text('Interview Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text(`Interview ID: ${interview_id}`, 20, 40);
    doc.text(`Candidate: ${data.meta?.user_first_name || ''} ${data.meta?.user_last_name || ''}`, 20, 50);
    doc.text(`Date: ${new Date(data.meta?.created_at).toLocaleDateString()}`, 20, 60);
    doc.text(`Skill: ${data.meta?.skill}`, 20, 70);
    doc.text(`Total Score: ${data.meta?.total_score}%`, 20, 80);
    doc.text(`Average Score: ${data.meta?.avg_score}`, 20, 90);
    
    // Questions Table on PAGE 1
    const tableData = data.questions?.map((q, index) => [
      index + 1,
      q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question,
      q.user_answer ? (q.user_answer.length > 60 ? q.user_answer.substring(0, 60) + '...' : q.user_answer) : 'No answer',
      q.ai_score || 'N/A',
      q.ai_feedback ? (q.ai_feedback.length > 70 ? q.ai_feedback.substring(0, 70) + '...' : q.ai_feedback) : 'No feedback'
    ]) || [];

    autoTable(doc, {
      head: [['#', 'Question', 'Answer', 'Score', 'AI Feedback']],
      body: tableData,
      startY: 105,
      styles: { 
        fontSize: 7,
        cellPadding: 2
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 55 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 45 }
      },
      margin: { top: 20, bottom: 20 }
    });

    // PAGE 2: Improvements & Confidence Tips
    doc.addPage();
    
    let yPosition = 30;
    
    // Clean and deduplicate improvements
    const uniqueImprovements = data.meta?.improvements 
      ? [...new Set(data.meta.improvements.split(';').map(s => s.trim()).filter(Boolean))]
      : [];
    
    if (uniqueImprovements.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('📈 Areas for Improvement', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(60);
      uniqueImprovements.forEach((improvement, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${improvement}`, pageWidth - 40);
        lines.forEach(line => {
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
    
    // Clean and deduplicate confidence tips
    const uniqueConfidenceTips = data.meta?.confidence_tips 
      ? [...new Set(data.meta.confidence_tips.split(';').map(s => s.trim()).filter(Boolean))]
      : [];
    
    if (uniqueConfidenceTips.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('🚀 Confidence Building Tips', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(60);
      uniqueConfidenceTips.forEach((tip, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${tip}`, pageWidth - 40);
        lines.forEach(line => {
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

  if (!isLoaded || loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isDark ? 'border-purple-200 border-t-purple-600' : 'border-blue-200 border-t-blue-600'} mx-auto mb-4`}></div>
          <p className={isDark ? 'text-purple-200' : 'text-gray-600'}>Loading report details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center`}>
        <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl p-8 max-w-md text-center`}>
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.19 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>Error Loading Report</h2>
          <p className={`${isDark ? 'text-purple-200' : 'text-gray-600'} mb-4`}>{error || 'Report not found'}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.push('/reports')} 
              className={`w-full px-4 py-2 ${isDark ? 'border-white/20 text-purple-200 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} border rounded-lg transition-colors`}
            >
              Back to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  const interview = data.meta || {};
  const questions = data.questions || [];
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.user_answer && q.user_answer.trim()).length;
  const averageScore = totalQuestions ? (questions.reduce((sum, q) => sum + (q.ai_score || 0), 0) / totalQuestions).toFixed(1) : 0;

  // DEDUPLICATE IMPROVEMENTS & CONFIDENCE TIPS FOR UI
  const uniqueImprovements = interview.improvements 
    ? [...new Set(interview.improvements.split(';').map(s => s.trim()).filter(Boolean))]
    : [];
    
  const uniqueConfidenceTips = interview.confidence_tips 
    ? [...new Set(interview.confidence_tips.split(';').map(s => s.trim()).filter(Boolean))]
    : [];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* ✅ TOP BAR: Back Button + Theme Toggle + PDF Button */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/reports')}
              className={`inline-flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-white/10 border-white/20 text-purple-200 hover:bg-white/20' : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-white'} border rounded-xl transition-all duration-300 backdrop-blur-sm`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Reports
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className={`inline-flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-white/10 border-white/20 text-purple-200 hover:bg-white/20' : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-white'} border rounded-xl transition-all duration-300 backdrop-blur-sm`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              🏠 Home
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* ✅ THEME TOGGLE */}
            <ThemeToggle />
            
            <button 
              onClick={generatePDF} 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold ${isDark ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'} bg-clip-text text-transparent mb-4`}>
            Interview Report 📋
          </h1>
          <p className={`text-xl ${isDark ? 'text-purple-200' : 'text-gray-600'}`}>
            Detailed analysis of interview #{interview_id}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className={`${isDark ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border-blue-400/30' : 'bg-white/80 backdrop-blur-xl border-blue-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-blue-300' : 'text-blue-600'} text-sm font-medium mb-2`}>Final Score</p>
                <p className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
                  {interview.total_score || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border-green-400/30' : 'bg-white/80 backdrop-blur-xl border-green-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-green-300' : 'text-green-600'} text-sm font-medium mb-2`}>Average Score</p>
                <p className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-green-600 to-emerald-600'} bg-clip-text text-transparent`}>
                  {averageScore}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-xl border-yellow-400/30' : 'bg-white/80 backdrop-blur-xl border-yellow-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-yellow-300' : 'text-yellow-600'} text-sm font-medium mb-2`}>Questions</p>
                <p className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-yellow-600 to-orange-600'} bg-clip-text text-transparent`}>
                  {answeredQuestions}/{totalQuestions}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border-purple-400/30' : 'bg-white/80 backdrop-blur-xl border-purple-200'} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-purple-300' : 'text-purple-600'} text-sm font-medium mb-2`}>Skill</p>
                <p className={`text-lg font-bold ${isDark ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-purple-600 to-pink-600'} bg-clip-text text-transparent`}>
                  {interview.skill}
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

        {/* Interview Details & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Interview Details */}
          <div className={`${isDark ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white/80 backdrop-blur-xl border-white/40'} border rounded-2xl p-6`}>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-6 flex items-center gap-2`}>
              <svg className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Interview Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-400/30' : 'bg-blue-50 border-blue-200'} rounded-lg flex items-center justify-center border`}>
                  <svg className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-gray-600'}`}>Candidate</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{interview.user_first_name} {interview.user_last_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-400/30' : 'bg-green-50 border-green-200'} rounded-lg flex items-center justify-center border`}>
                  <svg className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1h3z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-gray-600'}`}>Date</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(interview.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border-yellow-400/30' : 'bg-yellow-50 border-yellow-200'} rounded-lg flex items-center justify-center border`}>
                  <svg className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-gray-600'}`}>Interview ID</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>#{interview_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className={`${isDark ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white/80 backdrop-blur-xl border-white/40'} border rounded-2xl p-6`}>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-6`}>Performance Overview</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-purple-300' : 'text-gray-600'}>Overall Performance</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{interview.total_score || 0}%</span>
                </div>
                <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full h-3`}>
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${interview.total_score || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-purple-300' : 'text-gray-600'}>Questions Completed</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{(answeredQuestions/totalQuestions*100).toFixed(0)}%</span>
                </div>
                <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full h-3`}>
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredQuestions/totalQuestions)*100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className={`text-center p-4 ${isDark ? 'bg-green-500/20 border-green-400/30' : 'bg-green-50 border-green-200'} rounded-xl border`}>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{answeredQuestions}</p>
                  <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>Answered</p>
                </div>
                <div className={`text-center p-4 ${isDark ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-200'} rounded-xl border`}>
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.19 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{totalQuestions - answeredQuestions}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Skipped</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        <div className={`${isDark ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white/80 backdrop-blur-xl border-white/40'} border rounded-2xl mb-12`}>
          <div className={`px-6 py-4 ${isDark ? 'border-white/20' : 'border-gray-200'} border-b`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <svg className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Questions & Feedback ({questions.length})
            </h2>
          </div>
          
          <div className="p-6">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className={`w-16 h-16 ${isDark ? 'bg-purple-500/20 border-purple-400/30' : 'bg-gray-100 border-gray-200'} rounded-full flex items-center justify-center mx-auto mb-4 border`}>
                  <svg className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={isDark ? 'text-purple-200' : 'text-gray-600'}>No questions found for this interview.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className={`${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/50 border-gray-200 hover:bg-white/70'} border rounded-xl p-6 transition-colors`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-2 flex items-center gap-2`}>
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-full">
                            {index + 1}
                          </span>
                          Question {index + 1}
                        </h3>
                        <p className={`${isDark ? 'text-purple-100' : 'text-gray-700'} mb-4 leading-relaxed`}>{question.question}</p>
                      </div>
                      <span className={`ml-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(question.ai_score)} backdrop-blur-sm`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {question.ai_score || 0}/10
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-purple-200' : 'text-gray-700'} mb-2 flex items-center gap-1`}>
                          <svg className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Your Answer:
                        </h4>
                        <div className={`${isDark ? 'bg-blue-500/10 border-blue-400 text-blue-100' : 'bg-blue-50 border-blue-200 text-blue-900'} p-3 rounded-lg border-l-4 text-sm leading-relaxed max-h-32 overflow-y-auto`}>
                          {question.user_answer || "No answer provided"}
                        </div>
                      </div>

                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-purple-200' : 'text-gray-700'} mb-2 flex items-center gap-1`}>
                          <svg className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          AI Feedback:
                        </h4>
                        <div className={`${isDark ? 'bg-green-500/10 border-green-400 text-green-100' : 'bg-green-50 border-green-200 text-green-900'} p-3 rounded-lg border-l-4 text-sm leading-relaxed max-h-32 overflow-y-auto`}>
                          {question.ai_feedback || "No feedback available"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* IMPROVEMENTS & CONFIDENCE TIPS */}
        {(uniqueImprovements.length > 0 || uniqueConfidenceTips.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {uniqueImprovements.length > 0 && (
              <div className={`${isDark ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-xl border-orange-400/30' : 'bg-white/80 backdrop-blur-xl border-orange-200'} border rounded-2xl p-6`}>
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
              <div className={`${isDark ? 'bg-gradient-to-br from-green-500/20 to-blue-600/20 backdrop-blur-xl border-green-400/30' : 'bg-white/80 backdrop-blur-xl border-green-200'} border rounded-2xl p-6`}>
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
