import "dotenv/config";

export const PORT = Number(process.env.PORT) || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || "booker-dev-secret";

// DEBUG=booker (or 1/true/*) logs requests and Prisma queries. Request bodies are never logged.
export const DEBUG = ["1", "true", "booker", "*"].includes(
  (process.env.DEBUG ?? "").trim().toLowerCase(),
);

// Test-support endpoints (/api/testing) are on unless NODE_ENV=production; BOOKER_TEST_API overrides.
export const TEST_API_ENABLED =
  process.env.BOOKER_TEST_API !== undefined
    ? process.env.BOOKER_TEST_API === "1"
    : process.env.NODE_ENV !== "production";
