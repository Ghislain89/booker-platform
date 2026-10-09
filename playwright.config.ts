import { defineConfig, devices } from "@playwright/test";

const USER_STATE = "playwright/.auth/user.json";
const ADMIN_STATE = "playwright/.auth/admin.json";

// Every browser gets a project for the user tests and one for the admin tests
// (`*.admin.spec.ts`). Chromium runs by default; firefox and webkit only when you
// ask for them: `npx playwright test --project "firefox-*" --project "webkit-*"`.
const browsers = [
  { prefix: "ui", device: devices["Desktop Chrome"], isDefault: true },
  { prefix: "firefox", device: devices["Desktop Firefox"], isDefault: false },
  { prefix: "webkit", device: devices["Desktop Safari"], isDefault: false },
];

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
    ...browsers.flatMap(({ prefix, device, isDefault }) => [
      {
        name: `${prefix}-user`,
        testDir: "./playwright/tests/ui",
        testIgnore: [/.*\.admin\.spec\.ts/, MOBILE_SPECS, CHAOS_SPECS],
        use: { ...device, storageState: USER_STATE },
        dependencies: ["setup"],
        default: isDefault,
      },
      {
        name: `${prefix}-admin`,
        testDir: "./playwright/tests/ui",
        testMatch: /.*\.admin\.spec\.ts/,
        use: { ...device, storageState: ADMIN_STATE },
        dependencies: ["setup"],
        default: isDefault,
      },
    ]),
    // Assignment 5 (emulation): a Dutch phone in dark mode.
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
    // Assignment 10 (flaky-test clinic): every request switches on the chaos flags.
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
  ],
});
