"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook. `defaultValue` is used for the server render and
 * the first client render (pass the value that avoids a layout flash for the
 * common case), then corrected on mount.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
