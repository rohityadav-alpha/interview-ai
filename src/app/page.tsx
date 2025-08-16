'use client';

import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useCustomAuth } from '@/hooks/useCustomAuth';

export default function Home() {
  const { isSignedIn } = useCustomAuth();
  const { themeColors, isDark } = useTheme();

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Scoring",
      description: "Get instant feedback from Google Gemini 2.5 Flash AI with detailed analysis of your answers",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: "🎤",
      title: "Voice & Text Input",
      description: "Practice with voice recognition or type your answers - whatever feels more comfortable",
      color: "from-green-500 to-green-600"
    },
    {
      icon: "📊",
      title: "Progress Tracking",
      description: "Monitor your improvement over time with detailed analytics and performance insights",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: "🏆",
      title: "Global Leaderboard",
      description: "Compete with developers worldwide and see how you rank against your peers",
      color: "from-amber-500 to-amber-600"
    },
    {
      icon: "⚡",
      title: "Real-time Feedback",
      description: "Get immediate scoring and feedback to identify strengths and areas for improvement",
      color: "from-red-500 to-red-600"
    },
    {
      icon: "🎯",
      title: "Skill-based Practice",
      description: "Choose from 50+ technical skills with multiple difficulty levels for targeted practice",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up / Sign In",
      description: "Create an account to access AI-driven practice and save progress.",
      icon: "🚀"
    },
    {
      number: "02",
      title: "Practice Interviews",
      description: "Choose skills/difficulty, answer AI questions, get instant feedback.",
      icon: "💬"
    },
    {
      number: "03",
      title: "Track Your Progress",
      description: "See stats, strengths, review & improve.",
      icon: "📈"
    },
    {
      number: "04",
      title: "Climb the Leaderboard",
      description: "Compare with others & top the leaderboard!",
      icon: "🏆"
    }
  ];

  const technologies = [
    { name: "JavaScript", color: "text-yellow-400" },
    { name: "React", color: "text-blue-400" },
    { name: "Node.js", color: "text-green-400" },
    { name: "Python", color: "text-blue-300" },
    { name: "Java", color: "text-red-400" },
    { name: "TypeScript", color: "text-blue-500" },
    { name: "CSS", color: "text-pink-400" },
    { name: "HTML", color: "text-orange-400" }
  ];

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bgGradient}`}>
      <ThemeToggle />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold ${themeColors.text} mb-6 leading-tight`}>
                Master technical interviews with{' '}
                <span className={`bg-gradient-to-r ${themeColors.accent} bg-clip-text text-transparent`}>
                  AI-powered feedback
                </span>{' '}
                & track your improvement 📈
              </h1>
              <p className={`text-xl md:text-2xl ${themeColors.textSecondary} mb-8 max-w-3xl mx-auto`}>
                Practice with real interview questions, get instant AI feedback, and compete on global leaderboards
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isSignedIn ? (
                <Link
                  href="/start-interview"
                  className={`px-8 py-4 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-400/30`}
                >
                  🎯 Start Your First Interview →
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className={`px-8 py-4 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-400/30`}
                  >
                    🚀 Get Started Free →
                  </Link>
                  <Link
                    href="/sign-in"
                    className={`px-8 py-4 ${themeColors.cardBg} ${themeColors.text} rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm ${themeColors.cardBorder} border`}
                  >
                    🔑 Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Technologies */}
            <div className="mb-16">
              <p className={`${themeColors.textSecondary} mb-6 text-lg`}>Practice with popular technologies:</p>
              <div className="flex flex-wrap justify-center gap-4">
                {technologies.map((tech, index) => (
                  <span
                    key={index}
                    className={`${tech.color} font-semibold text-lg px-4 py-2 ${themeColors.cardBg} rounded-full backdrop-blur-sm ${themeColors.cardBorder} border shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                  >
                    {tech.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-bold ${themeColors.text} mb-4`}>
                Advanced AI technology meets practical interview preparation
              </h2>
              <p className={`text-xl ${themeColors.textSecondary} max-w-3xl mx-auto`}>
                for the ultimate learning experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 ${themeColors.cardBorder} border group`}
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className={`text-2xl font-bold ${themeColors.text} mb-4`}>
                    {feature.title}
                  </h3>
                  <p className={`${themeColors.textSecondary} leading-relaxed`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-bold ${themeColors.text} mb-4`}>
                Get started in minutes
              </h2>
              <p className={`text-xl ${themeColors.textSecondary} max-w-3xl mx-auto`}>
                with our simple, effective interview preparation process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 ${themeColors.cardBorder} border text-center group relative`}
                >
                  <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r ${themeColors.accent} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {step.number}
                  </div>
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${themeColors.text} mb-3`}>
                    {step.title}
                  </h3>
                  <p className={`${themeColors.textSecondary} text-sm leading-relaxed`}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-12 shadow-2xl ${themeColors.cardBorder} border`}>
              <h2 className={`text-3xl md:text-4xl font-bold ${themeColors.text} mb-6`}>
                Join thousands of developers who have improved their interview skills
              </h2>
              <p className={`text-lg ${themeColors.textSecondary} mb-8`}>
                with our AI-powered platform
              </p>
              {isSignedIn ? (
                <Link
                  href="/start-interview"
                  className={`inline-flex items-center px-8 py-4 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-400/30`}
                >
                  🎯 Start Your First Interview →
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className={`inline-flex items-center px-8 py-4 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-400/30`}
                >
                  🚀 Get Started Free →
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
