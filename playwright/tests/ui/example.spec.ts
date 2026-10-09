import { test, expect } from "@playwright/test";
import { LOGGED_OUT } from "../../support/auth";

// The projects start logged in; these tests need a fresh browser.
test.use({ storageState: LOGGED_OUT });

test.describe("login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("user can log in", { tag: "@smoke" }, async ({ page }) => {
    await test.step("fill in the credentials", async () => {
      await page.getByLabel("Username").fill("user");
      await page.getByLabel("Password").fill("password123");
    });
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(
      page.getByRole("heading", { name: "My bookings" }),
    ).toBeVisible();
  });

  test("shows an error for a wrong password", async ({ page }) => {
    await page.getByLabel("Username").fill("user");
    await page.getByLabel("Password").fill("not-my-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "Invalid username or password",
    );
  });
});
