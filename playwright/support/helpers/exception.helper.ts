import { APIResponse } from "@playwright/test";

export async function safeJsonParse(response: APIResponse): Promise<any> {
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`Response from ${response.url} was not valid JSON.`);
    }
}