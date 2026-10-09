import path from "node:path";
import { test, expect } from "@playwright/test";
import { LOGGED_OUT } from "../../support/auth";

test.use({ storageState: LOGGED_OUT });

// Screenshots differ per browser and operating system, so we keep baselines for
// Chromium only (macOS for local runs, Linux for CI). Update them with
// `npx playwright test assignment6 --update-snapshots`, and on CI with the
// "Update snapshots" workflow.
test.beforeEach(async ({ page, browserName }) => {
  test.skip(
    browserName !== "chromium",
    "Visual baselines are kept for Chromium only",
  );
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(3);
});

test(
  "Assignment 6: home page with the deal of the day masked",
  { tag: "@visual" },
  async ({ page }) => {
    await expect(page).toHaveScreenshot("home-masked.png", {
      fullPage: true,
      mask: [page.getByTestId("deal-of-the-day")],
    });
  },
);

test(
  "Assignment 6: home page with the deal of the day hidden",
  { tag: "@visual" },
  async ({ page }) => {
    await expect(page).toHaveScreenshot("home-hidden.png", {
      fullPage: true,
      stylePath: path.join(__dirname, "visual.css"),
    });
  },
);
