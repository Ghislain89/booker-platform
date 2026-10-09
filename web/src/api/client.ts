import { getToken } from "../lib/token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

export const UNAUTHORIZED_EVENT = "booker:unauthorized";

type Options = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

/** Small fetch wrapper: JSON in, JSON out, `Authorization` header when logged in. */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "")
      url.searchParams.set(key, String(value));
  }
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url.pathname + url.search, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Please try again.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    const message =
      typeof json.error === "string"
        ? json.error
        : `Request failed (${response.status})`;
    if (
      token &&
      (response.status === 401 ||
        (response.status === 403 && message === "Invalid token"))
    ) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, message, json.details);
  }
  return json as T;
}

export type DataResponse<T> = { success: true; data: T };
