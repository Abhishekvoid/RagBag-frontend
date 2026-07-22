"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-9" />;

  const isDark = resolvedTheme === "dark";

  const toggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark";
    const doc = document as ViewTransitionDocument;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fallback: no View Transitions support or reduced motion → plain swap.
    if (!doc.startViewTransition || prefersReduced) {
      setTheme(next);
      return;
    }

    // Radiate the new theme out from the centre of the toggle button.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // flushSync so next-themes writes the <html> class before the snapshot.
    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    await transition.ready;

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
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className="active-press [&_svg]:transition-transform [&_svg]:duration-500 hover:[&_svg]:rotate-45"
      onClick={toggle}
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </Button>
  );
}
