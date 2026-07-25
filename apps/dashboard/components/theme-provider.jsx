"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const COLOR_MODE_STORAGE_KEY = "bobot-dashboard-color-mode";

const ThemeContext = createContext({ theme: "light", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

// Resolve the persisted mode synchronously on first client render so the apply
// effect never runs with a default that would clobber the saved choice.
function getInitialMode() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore storage read failures (private mode)
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, theme);
    } catch {
      // ignore storage write failures (quota / private mode)
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === "dark" ? "dark" : "light");
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
