import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings } from './SettingsContext.jsx';

const STORAGE_KEY = 'dhms_theme';
const ThemeContext = createContext(null);

const readSaved = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return ['light', 'dark', 'system'].includes(v) ? v : null;
  } catch {
    return null;
  }
};

export function ThemeProvider({ children }) {
  const { settings } = useSettings();
  const [saved, setSaved] = useState(readSaved); // the visitor's own choice wins over the admin default
  const mode = saved || settings.theme.mode || 'system';
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const setMode = useCallback((next) => {
    setSaved(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
  }, []);

  const value = useMemo(() => ({ mode, isDark, setMode }), [mode, isDark, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};
