"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

/**
 * Paper | Onyx theme toggle.
 * A two-segment pill (matches the design prototype); the active segment gets
 * the ink/paper inversion. Switching radiates the new theme out from the pill
 * via the View Transitions API, falling back to an instant swap where the API
 * is missing or motion is reduced. Press "T" anywhere to toggle.
 */
export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  const applyTheme = useCallback(
    (next: "light" | "dark", origin?: { x: number; y: number }) => {
      if (next === resolvedTheme) return;
      const doc = document as ViewTransitionDocument;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (!doc.startViewTransition || prefersReduced) {
        setTheme(next);
        return;
      }

      const x = origin?.x ?? window.innerWidth - 64;
      const y = origin?.y ?? 40;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = doc.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    },
    [resolvedTheme, setTheme],
  );

  // Press "T" to toggle (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "t" || e.metaKey || e.ctrlKey || e.altKey)
        return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      applyTheme(isDark ? "light" : "dark");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyTheme, isDark]);

  if (!mounted) return <div className="h-8 w-[104px]" aria-hidden />;

  const pick = (next: "light" | "dark") => (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    applyTheme(next, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const seg =
    "px-3 py-1 text-[12px] font-mono tracking-wide rounded-full transition-colors duration-200 active-press";

  return (
    <div
      role="group"
      aria-label="Theme"
      title="Toggle Paper / Onyx (press T)"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card/60 p-0.5"
    >
      <button
        type="button"
        aria-pressed={!isDark}
        onClick={pick("light")}
        className={`${seg} ${!isDark ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
      >
        Paper
      </button>
      <button
        type="button"
        aria-pressed={isDark}
        onClick={pick("dark")}
        className={`${seg} ${isDark ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
      >
        Onyx
      </button>
    </div>
  );
}
