import { defineConfig } from "orval";
import "dotenv/config";
import path from "path";

// Generates Zod schemas from the OpenAPI spec (`npm run swagger:export` writes it).
// Everything in playwright/support/generated/ is generated: don't edit it by hand.
const target = path.join(__dirname, "playwright", "support", "generated", "openapi.json");
export default defineConfig({
  Zod: {
    input: {
      target: target,
      validation: false,
    },
    output: {
      mode: "tags",
      target: "playwright/support/generated/zod/index.ts",
      schemas: "playwright/support/generated/zod/types",
      client: "zod",
      clean: true,
    },
  },
});
