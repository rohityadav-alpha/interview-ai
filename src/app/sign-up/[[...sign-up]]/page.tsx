'use client';

import { SignUp } from "@clerk/nextjs";
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export default function SignUpPage() {
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
          href="/sign-in"
          className={`px-6 py-2 ${themeColors.cardBg} ${themeColors.text} rounded-xl font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm ${themeColors.cardBorder} border`}
        >
          Sign In
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Side - Marketing Content */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${themeColors.text} mb-6 leading-tight`}>
                  Start your journey with{' '}
                  <span className={`bg-gradient-to-r ${themeColors.accent} bg-clip-text text-transparent`}>
                    Interview AI
                  </span>
                </h1>
                <p className={`text-xl md:text-2xl ${themeColors.textSecondary} mb-8 max-w-2xl`}>
                  Join thousands of developers mastering technical interviews with AI-powered feedback
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-6 mb-8">
                {[
                  {
                    icon: "🚀",
                    title: "Get Started Free",
                    description: "No credit card required - start practicing immediately"
                  },
                  {
                    icon: "🎯",
                    title: "Personalized Practice",
                    description: "Choose from 50+ skills with multiple difficulty levels"
                  },
                  {
                    icon: "📈",
                    title: "Track Progress",
                    description: "See your improvement over time with detailed analytics"
                  },
                  {
                    icon: "🏆",
                    title: "Compete Globally",
                    description: "Rank on leaderboards and compare with peers"
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl ${themeColors.cardBg} backdrop-blur-sm ${themeColors.cardBorder} border flex items-center justify-center text-xl`}>
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className={`font-bold ${themeColors.text}`}>{benefit.title}</h3>
                      <p className={`text-sm ${themeColors.textSecondary}`}>{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Technologies */}
              <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-6 ${themeColors.cardBorder} border shadow-xl`}>
                <h3 className={`font-bold ${themeColors.text} mb-4 text-center`}>
                  Practice with Popular Technologies
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript'].map((tech, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 ${themeColors.cardBg} ${themeColors.textSecondary} rounded-full text-sm ${themeColors.cardBorder} border`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="flex justify-center">
              <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-8 shadow-2xl ${themeColors.cardBorder} border`}>
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-bold ${themeColors.text} mb-2`}>
                    Create Your Account
                  </h2>
                  <p className={`${themeColors.textSecondary}`}>
                    Start practicing interviews with AI feedback
                  </p>
                </div>

                <SignUp 
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
          Already have an account?{' '}
          <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
