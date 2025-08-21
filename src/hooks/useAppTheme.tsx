"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeName = "cosmic-night" | "notebook" | "vintage-paper";
type Mode = "light" | "dark";

type Ctx = {
  themeName: ThemeName;
  mode: Mode;
  setThemeName: (t: ThemeName) => void;
  toggleMode: () => void;
  setMode: (m: Mode) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

function apply(themeName: ThemeName, mode: Mode) {
  const root = document.documentElement;

  // Theme brand: default (cosmic-night) uses *no* data-theme
  if (themeName === "cosmic-night") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", themeName);
  }

  // Mode: .dark class on <html>
  root.classList.toggle("dark", mode === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const readInitial = (): { themeName: ThemeName; mode: Mode } => {
    // Theme default: cosmic-night
    const storedTheme = (typeof window !== "undefined" && localStorage.getItem("theme-name")) as ThemeName | null;
    const themeName: ThemeName = storedTheme ?? "cosmic-night";

    // Mode default: system
    let mode: Mode = "light";
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("theme-mode") as Mode | null;
      if (storedMode) {
        mode = storedMode;
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        mode = "dark";
      }
    }
    return { themeName, mode };
  };

  const [{ themeName, mode }, setState] = useState(readInitial);

  useEffect(() => {
    setMounted(true);
    apply(themeName, mode);

    // sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme-name" || e.key === "theme-mode") {
        setState({
          themeName: (localStorage.getItem("theme-name") as ThemeName) ?? "cosmic-night",
          mode: (localStorage.getItem("theme-mode") as Mode) ?? "light",
        });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) return;
    apply(themeName, mode);
    localStorage.setItem("theme-name", themeName);
    localStorage.setItem("theme-mode", mode);
  }, [themeName, mode, mounted]);

  const value = useMemo<Ctx>(
    () => ({
      themeName,
      mode,
      setThemeName: (t) => setState((s) => ({ ...s, themeName: t })),
      setMode: (m) => setState((s) => ({ ...s, mode: m })),
      toggleMode: () => setState((s) => ({ ...s, mode: s.mode === "dark" ? "light" : "dark" })),
    }),
    [themeName, mode]
  );

  if (!mounted) return null; // avoid hydration mismatch
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
