import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 reads the database URL and the seed command from here, not from
// the schema or package.json. Relative SQLite paths start at the project root.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
