'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function StartInterviewPage() {
  const router = useRouter();
  const { themeColors, isDark } = useTheme();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>('');

  const skills = [
    // Frontend
    { name: 'JavaScript', category: 'Frontend', icon: '🟨' },
    { name: 'React', category: 'Frontend', icon: '⚛️' },
    { name: 'Vue.js', category: 'Frontend', icon: '💚' },
    { name: 'Angular', category: 'Frontend', icon: '🔴' },
    { name: 'TypeScript', category: 'Frontend', icon: '🔷' },
    { name: 'HTML/CSS', category: 'Frontend', icon: '🎨' },

    // Backend
    { name: 'Node.js', category: 'Backend', icon: '💚' },
    { name: 'Python', category: 'Backend', icon: '🐍' },
    { name: 'Java', category: 'Backend', icon: '☕' },
    { name: 'C#', category: 'Backend', icon: '🟣' },
    { name: 'PHP', category: 'Backend', icon: '🐘' },
    { name: 'Go', category: 'Backend', icon: '🔵' },

    // Database
    { name: 'SQL', category: 'Database', icon: '🗄️' },
    { name: 'MongoDB', category: 'Database', icon: '🍃' },
    { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
    { name: 'Redis', category: 'Database', icon: '🔴' },

    // DevOps
    { name: 'Docker', category: 'DevOps', icon: '🐳' },
    { name: 'Kubernetes', category: 'DevOps', icon: '⚙️' },
    { name: 'AWS', category: 'DevOps', icon: '🟠' },
    { name: 'Git', category: 'DevOps', icon: '📁' }
  ];

  const skillCategories = Array.from(new Set(skills.map(skill => skill.category)));

  const toggleSkill = (skillName: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(s => s !== skillName);
      } else if (prev.length < 3) {
        return [...prev, skillName];
      }
      return prev;
    });
  };

  const handleStartInterview = () => {
    if (selectedSkills.length === 0 || !difficulty) {
      alert('Please select at least one skill and difficulty level');
      return;
    }

    const skillsParam = selectedSkills.join(',');
    router.push(`/interview?skill=${encodeURIComponent(skillsParam)}&difficulty=${difficulty}`);
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bgGradient}`}>
      <ThemeToggle />
      <Navbar />

      {/* Header */}
      <div className="relative py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className={`text-4xl md:text-5xl font-bold ${themeColors.text} mb-4`}>
            Start Your Interview
          </h1>
          <p className={`text-xl ${themeColors.textSecondary} max-w-2xl mx-auto`}>
            Select one or multiple skills and difficulty level to begin your personalized AI interview session
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 pb-8">
        <div className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl shadow-2xl ${themeColors.cardBorder} border overflow-hidden`}>
          <div className="p-8">
            {/* Skills Selection */}
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${themeColors.text} mb-4 flex items-center`}>
                <span className="mr-3">🎯</span>
                Select Your Skills
              </h2>
              <p className={`${themeColors.textSecondary} mb-6`}>
                Choose 1-3 skills for your interview
              </p>

              {skillCategories.map(category => (
                <div key={category} className="mb-6">
                  <h3 className={`text-lg font-semibold ${themeColors.text} mb-3`}>
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {skills
                      .filter(skill => skill.category === category)
                      .map(skill => (
                        <button
                          key={skill.name}
                          onClick={() => toggleSkill(skill.name)}
                          disabled={!selectedSkills.includes(skill.name) && selectedSkills.length >= 3}
                          className={`p-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border ${
                            selectedSkills.includes(skill.name)
                              ? `bg-gradient-to-r ${themeColors.accent} text-white shadow-lg scale-105`
                              : selectedSkills.length >= 3
                                ? `${themeColors.cardBg} ${themeColors.cardBorder} ${themeColors.textSecondary} opacity-50 cursor-not-allowed`
                                : `${themeColors.cardBg} ${themeColors.cardBorder} ${themeColors.text} hover:bg-white/10 hover:scale-105`
                          }`}
                        >
                          <div className="text-lg mb-1">{skill.icon}</div>
                          <div className="text-sm">{skill.name}</div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}

              {selectedSkills.length > 0 && (
                <div className={`mt-6 p-4 ${themeColors.cardBg} rounded-xl ${themeColors.cardBorder} border`}>
                  <h4 className={`font-semibold ${themeColors.text} mb-2`}>
                    🎯 Selected Skills for Interview:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(skill => (
                      <span
                        key={skill}
                        className={`px-3 py-1 bg-gradient-to-r ${themeColors.accent} text-white rounded-full text-sm font-medium flex items-center`}
                      >
                        {skill}
                        <button
                          onClick={() => toggleSkill(skill)}
                          className="ml-2 hover:text-red-200 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${themeColors.text} mb-4 flex items-center`}>
                <span className="mr-3">📊</span>
                Choose Difficulty Level
              </h2>
              <p className={`${themeColors.textSecondary} mb-6`}>
                Select the challenge level for all selected skills
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'easy', name: 'Easy', icon: '🟢', description: 'Basic concepts and fundamentals' },
                  { id: 'medium', name: 'Medium', icon: '🟡', description: 'Intermediate level with some complexity' },
                  { id: 'hard', name: 'Hard', icon: '🔴', description: 'Advanced concepts and problem-solving' }
                ].map(level => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`p-6 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border text-left ${
                      difficulty === level.id
                        ? `bg-gradient-to-r ${themeColors.accent} text-white shadow-lg scale-105`
                        : `${themeColors.cardBg} ${themeColors.cardBorder} ${themeColors.text} hover:bg-white/10 hover:scale-105`
                    }`}
                  >
                    <div className="text-3xl mb-2">{level.icon}</div>
                    <div className="text-xl font-bold mb-2">{level.name}</div>
                    <div className={`text-sm ${difficulty === level.id ? 'text-white/80' : themeColors.textSecondary}`}>
                      {level.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Preview */}
            {selectedSkills.length > 0 && difficulty && (
              <div className={`mb-8 p-6 ${themeColors.cardBg} rounded-xl ${themeColors.cardBorder} border`}>
                <h3 className={`text-xl font-bold ${themeColors.text} mb-4 flex items-center`}>
                  <span className="mr-3">📋</span>
                  Interview Preview
                </h3>
                <div className="space-y-2">
                  <p className={themeColors.textSecondary}>
                    <strong className={themeColors.text}>Skills:</strong> {selectedSkills.join(', ')}
                  </p>
                  <p className={themeColors.textSecondary}>
                    <strong className={themeColors.text}>Difficulty:</strong> {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </p>
                  <p className={themeColors.textSecondary}>
                    <strong className={themeColors.text}>Questions:</strong> 10 AI-generated questions
                  </p>
                  <p className={themeColors.textSecondary}>
                    <strong className={themeColors.text}>Time:</strong> No time limit - take your time
                  </p>
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="text-center">
              {selectedSkills.length === 0 || !difficulty ? (
                <div className={`p-4 ${themeColors.cardBg} rounded-xl ${themeColors.cardBorder} border`}>
                  <div className="text-2xl mb-2">⚠️</div>
                  <p className={themeColors.textSecondary}>
                    Please select at least one skill to continue
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleStartInterview}
                  className={`px-12 py-4 bg-gradient-to-r ${themeColors.accent} text-white rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-400/30`}
                >
                  🚀 Start Interview
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
