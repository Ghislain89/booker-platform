import { test, expect } from "@playwright/test";
import { createRandomUser } from "../../support/datafactories/user.factory";

test("Assignment 1: Authentication", async ({ request }) => {
  let token: string;
  const user = await createRandomUser();

  await test.step("Register a new user with valid credentials", async () => {
    const response = await request.post("auth/register", {
      data: user,
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty("token");
    expect(responseBody.data).toHaveProperty("user");
    expect(responseBody.data.user).toHaveProperty("role");
  });

  await test.step("Successfully login with the newly created user", async () => {
    const response = await request.post("auth/login", {
      data: { username: user.username, password: user.password },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty("token");
    expect(responseBody.data).toHaveProperty("user");
    expect(responseBody.data.user).toHaveProperty("username", user.username);
    expect(responseBody.data.user).toHaveProperty("role");

    token = responseBody.data.token;
  });

  await test.step("Successfully logout the authenticated user", async () => {
    const response = await request.post("auth/logout", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
  });
});
