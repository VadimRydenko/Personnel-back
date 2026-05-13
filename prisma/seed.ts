import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { ACCOUNT_TYPE_CATALOG } from "../src/modules/accounts/account-types.js";

const roles = ACCOUNT_TYPE_CATALOG.map((accountType, index) => ({
  id: index + 1,
  roleName: accountType.code,
  notes: `${accountType.title} — ${accountType.description}`,
}));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.role.deleteMany({
    where: {
      roleName: {
        notIn: roles.map((role) => role.roleName),
      },
    },
  });

  for (const role of roles) {
    await prisma.role.upsert({
      where: { roleName: role.roleName },
      update: { notes: role.notes },
      create: role,
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"role"', 'id'), GREATEST((SELECT MAX("id") FROM "role"), 1))`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
