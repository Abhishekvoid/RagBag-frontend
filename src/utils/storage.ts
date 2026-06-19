// src/utils/storage.ts
// Tokens are NOT stored here anymore. The access token lives in memory
// (see @/lib/authToken) and the refresh token is an httpOnly cookie owned
// by the Next.js BFF (src/app/api/auth/*). This module only persists the
// non-sensitive user profile (email + name) in localStorage.

import { getAccessToken } from "@/lib/authToken";

const USER_KEY = "user";
const isBrowser = typeof window !== "undefined";

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function setUser(user: { email: string; name: string }): void {
  if (!isBrowser) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): { email: string; name: string } | null {
  if (!isBrowser) return null;

  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function clearUser(): void {
  if (!isBrowser) return;
  localStorage.removeItem(USER_KEY);
}
