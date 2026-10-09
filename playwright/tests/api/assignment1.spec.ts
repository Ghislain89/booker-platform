import { test, expect } from "@playwright/test";
import { createRandomUser } from "../../support/datafactories/user.factory";

test("Assignment 1: Authentication", async ({ request }) => {
  let token: string;
  const user = await createRandomUser();

  await test.step("Register a new user with valid credentials", async () => {
    // This step is to register a new user
  });

  await test.step("Successfully login with the newly created user", async () => {
    // Login with the new user, store the token in the token variable (already define on line 5)
  });

  await test.step("Successfully logout the authenticated user", async () => {
   // Logout with the user you just logged in with. 
  });
});
