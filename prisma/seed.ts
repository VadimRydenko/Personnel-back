import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const roles = [
  { id: 1, roleName: "ALL_FULL_ACCESS", notes: "Полный доступ ко всему штату и наличию" },
  { id: 12, roleName: "CUZ_FULL_ACCESS", notes: "Полный доступ к штату и наличию ЦУЗ" },
  { id: 3, roleName: "1_VIDDIL_GVROS", notes: "1 отдел ГВРОС" },
  { id: 2, roleName: "STAFF_VIEW_ALL", notes: "Полный доступ к штату" },
  { id: 5, roleName: "2_VIDDIL_GVROS", notes: "2 отдел ГВРОС" },
  { id: 7, roleName: "PERSONNEL_VIEW_SHORT", notes: "Просмотр ограниченной информации по всему Департаменту" },
  { id: 8, roleName: "4_VIDDIL_GVROS", notes: "4 отдел ГВРОС" },
  { id: 9, roleName: "PERSONNEL_VIEW_ALL", notes: "Полный доступ к наличию" },
] as const;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
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
