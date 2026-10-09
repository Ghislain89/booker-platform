import { expect, type APIRequestContext } from "@playwright/test";

export const USER_STATE = "playwright/.auth/user.json";
export const ADMIN_STATE = "playwright/.auth/admin.json";
export const LOGGED_OUT = { cookies: [], origins: [] };

export const SEEDED_USER = { username: "user", password: "password123" };
export const SEEDED_ADMIN = { username: "admin", password: "password123" };

/** Logs in through the API and returns the JWT. */
export async function apiLogin(
  request: APIRequestContext,
  credentials: { username: string; password: string },
): Promise<string> {
  const response = await request.post("/api/auth/login", { data: credentials });
  await expect(response).toBeOK();
  const body = await response.json();
  return body.data.token;
}
