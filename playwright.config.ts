import { defineConfig, devices } from "@playwright/test";

const USER_STATE = "playwright/.auth/user.json";
const ADMIN_STATE = "playwright/.auth/admin.json";

// Specs that need their own project (see the end of the file).
const MOBILE_SPECS = /.*\.mobile\.spec\.ts/;
const CHAOS_SPECS = /.*\.chaos\.spec\.ts/;

export default defineConfig({
  testDir: "./playwright/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["list"], ["blob"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: process.env.CI ? "on-first-retry" : "on",
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
      name: "setup",
      testDir: "./playwright/tests/ui",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // The user tests, and the admin tests (`*.admin.spec.ts`), each with their own storage state.
    {
      name: "ui-user",
      testDir: "./playwright/tests/ui",
      testIgnore: [/.*\.admin\.spec\.ts/, MOBILE_SPECS, CHAOS_SPECS],
      use: { ...devices["Desktop Chrome"], storageState: USER_STATE },
      dependencies: ["setup"],
    },
    {
      name: "ui-admin",
      testDir: "./playwright/tests/ui",
      testMatch: /.*\.admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STATE },
      dependencies: ["setup"],
    },
    // Assignment 6 (emulation): a Dutch phone in dark mode.
    {
      name: "mobile",
      testDir: "./playwright/tests/ui",
      testMatch: MOBILE_SPECS,
      use: {
        ...devices["Pixel 7"],
        locale: "nl-NL",
        colorScheme: "dark",
        storageState: USER_STATE,
      },
      dependencies: ["setup"],
    },
    // Assignment 5 (flaky-test clinic): every request switches on the chaos flags.
    // Opt-in: `npx playwright test --project chaos`.
    {
      name: "chaos",
      testDir: "./playwright/tests/ui",
      testMatch: CHAOS_SPECS,
      use: {
        ...devices["Desktop Chrome"],
        storageState: USER_STATE,
        extraHTTPHeaders: {
          "x-booker-flags": "slow-rooms,flaky-booking,random-order,popup-cookie",
        },
      },
      dependencies: ["setup"],
      default: false,
    },
    // The code examples from the UI slides, checked against the app. CI runs them;
    // you don't need to. They expect freshly seeded data (`npm run setup`):
    // `npx playwright test --project slides`.
    {
      name: "slides",
      testDir: "./playwright/tests/slides",
      use: { ...devices["Desktop Chrome"] },
      default: false,
    },
  ],
});
