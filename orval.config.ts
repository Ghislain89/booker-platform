import { defineConfig } from "orval";
import "dotenv/config";
import path from "path";

const target = path.join(
  __dirname,
  "playwright",
  "support",
  "zod",
  "swagger.json",
); // Path to OpenAPI spec file
export default defineConfig({
  Zod: {
    input: {
      target: target,
      validation: false,
    },
    output: {
      mode: "tags",
      target: "playwright/support/zod/zod/index.ts",
      schemas: "playwright/support/zod/zod/types",
      client: "zod",
      clean: true,
    },
  },
});
