import { APIResponse } from "@playwright/test";

export interface ApiResponse {
  headers: Record<string, string>;
  statusCode: number;
  // Not `any`: Playwright hides custom matchers such as toMatchSchema on `any` values.
  responseBody: Record<string, any>;
}
