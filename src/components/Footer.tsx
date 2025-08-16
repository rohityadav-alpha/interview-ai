'use client';

import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
// ✅ ADDED: Theme imports
import { useTheme } from '@/hooks/useTheme';

export default function Footer() {
  // ✅ ADDED: Global theme
  const { themeColors, isDark } = useTheme();

  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Platform",
      links: [
        { label: "Start Interview", href: "/start-interview" },
        { label: "Leaderboard", href: "/leaderboard" },
        { label: "Progress", href: "/progress" },
        { label: "Dashboard", href: "/dashboard" }
      ]
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Documentation", href: "#" },
        { label: "Contact Us", href: "#" },
        { label: "Report Issue", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" }
      ]
    }
  ];

  const socialLinks = [
    { icon: FaGithub, href: "#", label: "GitHub", color: "hover:text-gray-300" },
    { icon: FaLinkedin, href: "#", label: "LinkedIn", color: "hover:text-blue-400" },
    { icon: FaXTwitter, href: "#", label: "Twitter", color: "hover:text-blue-300" }
  ];

  return (
    <footer className={`${themeColors.cardBg} backdrop-blur-md ${themeColors.cardBorder} border-t shadow-xl mt-auto`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🧠</span>
              <span className={`text-xl font-bold ${themeColors.text}`}>Interview AI</span>
            </div>
            <p className={`${themeColors.textSecondary} mb-6 leading-relaxed`}>
              Master technical interviews with AI-powered feedback and track your progress on global leaderboards.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-xl ${themeColors.cardBg} backdrop-blur-sm ${themeColors.cardBorder} border flex items-center justify-center ${themeColors.text} ${social.color} transition-all duration-200 hover:scale-110 shadow-lg`}
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className={`font-bold ${themeColors.text} mb-4 text-lg`}>
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`${themeColors.textSecondary} hover:text-blue-400 transition-colors duration-200 text-sm`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className={`mt-12 pt-8 border-t ${themeColors.cardBorder} flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0`}>
          <div className={`${themeColors.textSecondary} text-sm`}>
            © {currentYear} Interview AI. All rights reserved. Powered by Google Gemini ✨
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="#" className={`${themeColors.textSecondary} hover:text-blue-400 transition-colors`}>
              Privacy Policy
            </Link>
            <Link href="#" className={`${themeColors.textSecondary} hover:text-blue-400 transition-colors`}>
              Terms of Service
            </Link>
            <Link href="#" className={`${themeColors.textSecondary} hover:text-blue-400 transition-colors`}>
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
