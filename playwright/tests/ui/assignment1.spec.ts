import { test, expect } from "@playwright/test";
import { createRandomUser } from "../../support/datafactories/user.factory";
import { LOGGED_OUT } from "../../support/auth";

test.use({ storageState: LOGGED_OUT });

// Assignment 1A, written without page objects. Assignment 1B: every test
// generates its own user, so it passes with `fullyParallel` and `--repeat-each 5`.
test("Assignment 1: register a new user and log in", async ({ page }) => {
  const user = createRandomUser();

  await test.step("register a new user", async () => {
    await page.goto("/register");
    await page.getByLabel("Username").fill(user.username);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByLabel("Confirm password").fill(user.password);
    await page.getByLabel("I accept the terms and conditions").check();
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toContainText("Account created");
  });

  await test.step("log in with the new user", async () => {
    await page.getByLabel("Username").fill(user.username);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(
      page.getByRole("heading", { name: "My bookings" }),
    ).toBeVisible();
    await expect(page.getByText(`Signed in as ${user.username}`)).toBeVisible();
  });

  await test.step("a new user has no bookings", async () => {
    await expect(page.getByText("No bookings yet")).toBeVisible();
  });
});
