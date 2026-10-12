// Writes the OpenAPI spec to playwright/support/generated/openapi.json for `npm run codegen`.
import { writeFileSync } from "fs";
import path from "path";
import { swaggerSpec } from "../server/config/swagger";

const target = path.join(__dirname, "..", "playwright", "support", "generated", "openapi.json");
writeFileSync(target, `${JSON.stringify(swaggerSpec, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), target)}`);
