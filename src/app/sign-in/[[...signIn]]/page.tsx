'use client';

import { SignIn } from "@clerk/nextjs";
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export default function SignInPage() {
  const { themeColors, isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bgGradient}`}>
      <ThemeToggle />

      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Link
          href="/"
          className={`flex items-center space-x-2 ${themeColors.text} hover:text-blue-400 transition-colors`}
        >
          <span className="text-2xl">🧠</span>
          <span className="text-xl font-bold">Interview AI</span>
        </Link>

        <Link
          href="/"
          className={`px-6 py-2 ${themeColors.cardBg} ${themeColors.text} rounded-xl font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm ${themeColors.cardBorder} border`}
        >
          Home
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Side - Marketing Content */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${themeColors.text} mb-6 leading-tight`}>
                  Welcome back to{' '}
                  <span className={`bg-gradient-to-r ${themeColors.accent} bg-clip-text text-transparent`}>
                    Interview AI
                  </span>
                </h1>
                <p className={`text-xl md:text-2xl ${themeColors.textSecondary} mb-8 max-w-2xl`}>
                  Continue your journey to master technical interviews with AI-powered feedback
                </p>
              </div>

              {/* Features */}
              <div className="space-y-6 mb-8">
                {[
                  {
                    icon: "🧠",
                    title: "AI-Powered Scoring",
                    description: "Get instant feedback from Google Gemini AI"
                  },
                  {
                    icon: "📊",
                    title: "Progress Tracking",
                    description: "Monitor your improvement over time"
                  },
                  {
                    icon: "🏆",
                    title: "Global Leaderboard",
                    description: "Compete with developers worldwide"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl ${themeColors.cardBg} backdrop-blur-sm ${themeColors.cardBorder} border flex items-center justify-center text-xl`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className={`font-bold ${themeColors.text}`}>{feature.title}</h3>
                      <p className={`text-sm ${themeColors.textSecondary}`}>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-6 ${themeColors.cardBorder} border shadow-xl`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-2xl font-bold ${themeColors.text}`}>1000+</div>
                    <div className={`text-sm ${themeColors.textSecondary}`}>Developers</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${themeColors.text}`}>50+</div>
                    <div className={`text-sm ${themeColors.textSecondary}`}>Skills</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${themeColors.text}`}>10K+</div>
                    <div className={`text-sm ${themeColors.textSecondary}`}>Interviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Sign In Form */}
            <div className="flex justify-center">
              <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-8 shadow-2xl ${themeColors.cardBorder} border`}>
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-bold ${themeColors.text} mb-2`}>
                    Sign In to Your Account
                  </h2>
                  <p className={`${themeColors.textSecondary}`}>
                    Continue your interview practice journey
                  </p>
                </div>

                <SignIn 
                  appearance={{
                    elements: {
                      rootBox: "mx-auto",
                      card: `${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm border-0 shadow-none`,
                      headerTitle: `${isDark ? 'text-gray-100' : 'text-gray-900'}`,
                      headerSubtitle: `${isDark ? 'text-gray-300' : 'text-gray-600'}`,
                      socialButtonsBlockButton: `${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-100 hover:bg-gray-600/50' : 'bg-white/50 border-gray-300 text-gray-900 hover:bg-gray-50/50'} backdrop-blur-sm`,
                      formFieldInput: `${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-100' : 'bg-white/50 border-gray-300 text-gray-900'} backdrop-blur-sm`,
                      formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                      footerActionLink: `${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`,
                      identityPreviewText: `${isDark ? 'text-gray-300' : 'text-gray-600'}`,
                      formFieldLabel: `${isDark ? 'text-gray-200' : 'text-gray-700'}`
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className={`${themeColors.textSecondary} text-sm`}>
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
