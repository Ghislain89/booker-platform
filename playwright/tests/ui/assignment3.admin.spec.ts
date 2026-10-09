import { test, expect } from "@playwright/test";

// Runs in the ui-admin project, which starts with the admin state saved by auth.setup.ts.
test("Assignment 3: the admin starts logged in", async ({ page }) => {
  await page.goto("/admin/rooms");

  await expect(
    page.getByRole("heading", { name: "Room management" }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as admin")).toBeVisible();
});
