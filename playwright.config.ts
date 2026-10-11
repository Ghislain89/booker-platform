import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "API",
      testDir: "./playwright/tests/api",
      use: {
        ignoreHTTPSErrors: true,
        baseURL: "http://localhost:3000/api/",
      },
    },
    {
      name: "chromium",
      testDir: "./playwright/tests/ui",
      use: { ...devices["Desktop Chrome"] },
    },
    // Opt-in browsers: run them with `--project firefox` or `--project webkit`.
    {
      name: "firefox",
      testDir: "./playwright/tests/ui",
      use: { ...devices["Desktop Firefox"] },
      default: false,
    },
    {
      name: "webkit",
      testDir: "./playwright/tests/ui",
      use: { ...devices["Desktop Safari"] },
      default: false,
    },
    // The code examples from the UI slides, checked against the app. CI runs them;
    // you don't need to: `npx playwright test --project slides`.
    {
      name: "slides",
      testDir: "./playwright/tests/slides",
      use: { ...devices["Desktop Chrome"] },
      default: false,
    },
  ],
});
