import { APIRequestContext, APIResponse } from "@playwright/test";
import { ApiResponse } from "../../types/api.types";
import { safeJsonParse } from "../helpers/exception.helper";

type RequestOptions = {
  method: string;
  endpoint: string;
  data?: object;
  token?: string;
};

export class ApiFixture {
  private api: APIRequestContext;

  constructor(requestContext: APIRequestContext) {
    this.api = requestContext;
  }

  async request({
    method,
    endpoint,
    data,
    token,
  }: RequestOptions): Promise<ApiResponse> {
    const headers: { [key: string]: string } = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const options: { [key: string]: any } = { headers, ...(data && { data }) };

    const response = await this.api[method](endpoint, options);
    return this.formatResponse(response);
  }

  async get(endpoint: string, token?: string): Promise<ApiResponse> {
    return this.request({ method: "get", endpoint, token });
  }

  async post(
    endpoint: string,
    data: object,
    token?: string,
  ): Promise<ApiResponse> {
    return this.request({ method: "post", endpoint, data, token });
  }

  async put(
    endpoint: string,
    data: object,
    token?: string,
  ): Promise<ApiResponse> {
    return this.request({ method: "put", endpoint, data, token });
  }

  async delete(endpoint: string, token?: string): Promise<ApiResponse> {
    return this.request({ method: "delete", endpoint, token });
  }

  private async formatResponse(response: APIResponse): Promise<ApiResponse> {
    const responseBody = await safeJsonParse(response);
    const statusCode = response.status();
    const headers = response.headers();

    return { headers, statusCode, responseBody };
  }
}
