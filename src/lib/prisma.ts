import { PrismaClient } from "@prisma/client";
import { DEBUG } from "../config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Unexpected errors are logged by the error handler in server.ts.
    log: DEBUG ? ["query", "warn", "error"] : ["warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
