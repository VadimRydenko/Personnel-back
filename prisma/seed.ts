import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const roles = [
  {
    id: 1,
    roleName: "SECURITY_ADMIN",
    notes:
      "Адміністратор безпеки — керування політиками доступу, аудитом, ролями, без доступу до даних реєстру",
  },
  {
    id: 2,
    roleName: "REGISTRY_OPERATOR",
    notes: "Оператор/Реєстратор — робота з даними реєстру в межах повноважень",
  },
  {
    id: 3,
    roleName: "ANALYST",
    notes: "Аналітик — робота з аналітикою реєстру",
  },
  {
    id: 4,
    roleName: "SERVICE_ACCOUNT",
    notes: "Сервісний обліковий запис — для міжсистемної взаємодії",
  },
] as const;

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
