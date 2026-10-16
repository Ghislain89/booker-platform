import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";
import { DATABASE_URL, DEBUG } from "../config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Prisma 7 talks to SQLite through a driver adapter.
    adapter: new PrismaLibSql({ url: DATABASE_URL }),
    // Unexpected errors are logged by the error handler in server.ts.
    log: DEBUG ? ["query", "warn", "error"] : ["warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
