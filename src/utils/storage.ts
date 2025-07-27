// src/utils/storage.t

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const isBrowser = typeof window !== "undefined";

function setCookie(name: string, value: string, options: {
  maxAge?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
} = {}) {
  if (!isBrowser) return;
  
  const {
    maxAge = 24 * 60 * 60, 
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict'
  } = options;

  let cookieString = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=${sameSite}`;
  
  if (secure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue || null;
    }
  }
  return null;
}

function deleteCookie(name: string) {
  if (!isBrowser) return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

// Token management functions
export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  setCookie(ACCESS_TOKEN_KEY, token, {
    maxAge: 15 * 60,
    secure: true,
    sameSite: 'strict'
  });
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  setCookie(REFRESH_TOKEN_KEY, token, {
    maxAge: 7 * 24 * 60 * 60, 
    secure: true,
    sameSite: 'strict'
  });
}

export function clearTokens(): void {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
