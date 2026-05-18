'use client';
// src/components/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('ai-chronicle-theme') as Theme | null;
      const initial = (saved === 'light' || saved === 'dark') ? saved : 'dark';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    } catch {}
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('ai-chronicle-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'dark', toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
