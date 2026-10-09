// Writes the OpenAPI spec to playwright/support/zod/swagger.json for `npm run codegen`.
import { writeFileSync } from "fs";
import path from "path";
import { swaggerSpec } from "../src/config/swagger";

const target = path.join(__dirname, "..", "playwright", "support", "zod", "swagger.json");
writeFileSync(target, `${JSON.stringify(swaggerSpec, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), target)}`);
