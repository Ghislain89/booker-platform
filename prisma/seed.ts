import { prisma } from "../server/lib/prisma";
import { seedDatabase } from "../server/lib/seed";

seedDatabase(prisma)
  .then((counts) => console.log("Seeded:", counts))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
