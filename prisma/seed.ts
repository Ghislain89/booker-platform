import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/lib/seed";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((counts) => console.log("Seeded:", counts))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
