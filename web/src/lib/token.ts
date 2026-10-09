import type { Role } from "../api/types";

// The JWT lives in localStorage, so Playwright's storageState picks it up.
export const TOKEN_KEY = "booker.token";

export interface SessionUser {
  userId: string;
  username: string;
  role: Role;
  exp?: number;
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Reads the user from the token payload. Returns null for a missing, malformed or expired token. */
export function decodeToken(token: string | null): SessionUser | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const user = JSON.parse(atob(payload)) as SessionUser;
    if (!user.username || !user.role) return null;
    if (user.exp && user.exp * 1000 < Date.now()) return null;
    return user;
  } catch {
    return null;
  }
}
