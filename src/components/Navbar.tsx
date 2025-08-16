"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
// ✅ ADDED: Theme imports
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar({
  showHomeHamburger = false,
}: {
  showHomeHamburger?: boolean;
}) {
  // ✅ ADDED: Global theme
  const { themeColors, isDark } = useTheme();

  const { isSignedIn, userName, customSignOut, isLoading, isLoaded } = useCustomAuth();
  const [hydrated, setHydrated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleHomeRedirect = () => {
    router.push("/");
  };

  const handleSignOutClick = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await customSignOut();
    }
  };

  // HYDRATION FIX: Show consistent loading state
  if (!hydrated) {
    return (
      <nav className={`${themeColors.cardBg} backdrop-blur-md ${themeColors.cardBorder} border-b shadow-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className={`${themeColors.text} font-bold text-xl`}>
              Interview AI
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isHomePage = pathname === "/";

  // Navigation links
  const navigationLinks = [
    { href: "/progress", label: "📊 Progress", color: "text-green-300 hover:text-green-200" },
    { href: "/leaderboard", label: "🏆 Rankings", color: "text-purple-300 hover:text-purple-200" },
    { href: "/reports", label: "📄 Reports", color: "text-blue-300 hover:text-blue-200" }

  ];

  return (
    <nav className={`${themeColors.cardBg} backdrop-blur-md ${themeColors.cardBorder} border-b shadow-xl sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🧠</span>
            <div>
              <div className={`font-bold text-xl ${themeColors.text} group-hover:text-blue-400 transition-colors`}>
                Interview AI
              </div>
              <div className="text-xs text-blue-300 leading-none">
                Powered by Google Gemini ✨
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isHomePage ? (
              // HOME PAGE: Show full navigation with SignOut button
              <>
                {!isLoaded || isLoading ? (
                  <div className={`${themeColors.text} font-medium`}>
                    Loading...
                  </div>
                ) : isSignedIn ? (
                  <>
                    {/* Navigation Links */}
                    {navigationLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`${themeColors.text} hover:text-blue-400 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-white/10 ${
                          pathname === link.href ? 'bg-white/20 border border-blue-400/30' : ''
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}

                    {/* Theme Toggle */}
                    <ThemeToggle position="relative" size="sm" />

                    {/* User Menu */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${themeColors.accent} flex items-center justify-center text-white font-bold text-sm`}>
                        {userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-sm">
                        <div className={`${themeColors.text} font-medium`}>Hi, {userName}!</div>
                      </div>
                      <button
                        onClick={handleSignOutClick}
                        className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ThemeToggle position="relative" size="sm" />
                    <Link
                      href="/sign-in"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      🚀 Sign In
                    </Link>
                  </>
                )}
              </>
            ) : (
              // NON-HOME PAGES: Show navigation with Home button instead of SignOut
              <>
                {isSignedIn && (
                  <>
                    {/* Navigation Links */}
                    {navigationLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`${themeColors.text} hover:text-blue-400 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-white/10 ${
                          pathname === link.href ? 'bg-white/20 border border-blue-400/30' : ''
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}

                    {/* Theme Toggle */}
                    <ThemeToggle position="relative" size="sm" />

                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${themeColors.accent} flex items-center justify-center text-white font-bold text-sm`}>
                        {userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className={`${themeColors.text} text-sm font-medium`}>
                        {userName}
                      </div>
                    </div>

                    {/* HOME BUTTON instead of SignOut on non-home pages */}
                    <button
                      onClick={handleHomeRedirect}
                      className="bg-gradient-to-r from-green-500/80 to-blue-500/80 hover:from-green-600/90 hover:to-blue-600/90 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                    >
                      <span>🏠</span>
                      <span>Home</span>
                    </button>
                  </>
                )}
                {!isSignedIn && <ThemeToggle position="relative" size="sm" />}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`${themeColors.text} hover:text-blue-400 focus:outline-none focus:text-blue-400 transition-colors duration-200 md:hidden`}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden ${themeColors.cardBg} backdrop-blur-sm border-t ${themeColors.cardBorder} p-4 space-y-4`}>
            {isSignedIn ? (
              <>
                {/* Mobile Navigation Links */}
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 ${themeColors.text} font-medium rounded-lg hover:bg-white/10 transition-all duration-200 ${
                      pathname === link.href ? 'bg-white/20 border border-blue-400/30' : ''
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Theme Toggle */}
                <div className="px-4 py-2">
                  <ThemeToggle position="relative" size="sm" />
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-3 px-4 py-2">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${themeColors.accent} flex items-center justify-center text-white font-bold`}>
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className={`${themeColors.text} font-medium`}>Hi, {userName}!</div>
                </div>

                {/* Mobile: Show appropriate button based on page */}
                {isHomePage ? (
                  // Home page: Show SignOut button
                  <button
                    onClick={() => {
                      handleSignOutClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-red-500/80 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    Sign Out
                  </button>
                ) : (
                  // Other pages: Show Home button
                  <button
                    onClick={() => {
                      handleHomeRedirect();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-green-500/80 to-blue-500/80 hover:from-green-600/90 hover:to-blue-600/90 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>🏠</span>
                    <span>Home</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="px-4 py-2">
                  <ThemeToggle position="relative" size="sm" />
                </div>
                <Link
                  href="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-bold transition-all duration-200"
                >
                  🚀 Sign In
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
