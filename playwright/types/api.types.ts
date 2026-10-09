import { APIResponse } from "@playwright/test";

export interface ApiResponse {
  headers: Record<string, string>;
  statusCode: number;
  responseBody: any;
}
