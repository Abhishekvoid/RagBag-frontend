// Access token lives in memory ONLY — never cookie/localStorage.
// Lost on full reload; restored via POST /api/auth/refresh (httpOnly cookie).
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
