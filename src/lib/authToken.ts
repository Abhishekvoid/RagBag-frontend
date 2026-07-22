// Access token lives in memory ONLY — never cookie/localStorage.
// Lost on full reload; restored via POST /api/auth/refresh (httpOnly cookie).
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Single-flight refresh: on dashboard load the page effect AND every panel's
// first API call can all need a refresh at once. If the backend rotates refresh
// tokens, concurrent refreshes invalidate each other and bounce the user to
// login. Dedupe so only ONE /api/auth/refresh runs and everyone shares it.
let refreshInFlight: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const r = await fetch("/api/auth/refresh", { method: "POST" });
      if (!r.ok) throw new Error("refresh failed");
      const { access } = await r.json();
      setAccessToken(access);
      return access as string;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
