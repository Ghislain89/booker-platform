import { test, expect } from "@playwright/test";

// Runs in the ui-user project, which starts with the state saved by auth.setup.ts.
test("Assignment 3: the user starts logged in", async ({ page }) => {
  await page.goto("/my/bookings");

  await expect(
    page.getByRole("heading", { name: "My bookings" }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as user")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Room management" }),
  ).toBeHidden();
});
