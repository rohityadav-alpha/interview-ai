'use client';

import { useTheme as useThemeContext } from '@/contexts/ThemeContext';

// ✅ Re-export with additional utilities
export function useTheme() {
  const context = useThemeContext();

  // ✅ Additional theme utilities
  const getThemeClass = (lightClass: string, darkClass: string) => {
    return context.isDark ? darkClass : lightClass;
  };

  const getConditionalClass = (baseClass: string, darkModifier?: string) => {
    return context.isDark ? `${baseClass} ${darkModifier || 'dark:opacity-80'}` : baseClass;
  };

  return {
    ...context,
    getThemeClass,
    getConditionalClass
  };
}
