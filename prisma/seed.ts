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

  const permissionSeeds = [
    {
      id: "a1000000-0000-4000-8000-000000000001",
      code: "registry.read",
      label: "Читання реєстру",
      description: "Перегляд записів реєстру",
    },
    {
      id: "a1000000-0000-4000-8000-000000000002",
      code: "registry.write",
      label: "Зміна реєстру",
      description: "Створення та оновлення записів реєстру",
    },
    {
      id: "a1000000-0000-4000-8000-000000000003",
      code: "analytics.read",
      label: "Аналітика",
      description: "Доступ до аналітичних звітів",
    },
    {
      id: "a1000000-0000-4000-8000-000000000004",
      code: "security.audit",
      label: "Аудит безпеки",
      description: "Перегляд журналів аудиту та політик",
    },
  ] as const;

  for (const permission of permissionSeeds) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { label: permission.label, description: permission.description },
      create: permission,
    });
  }

  const groupSeeds = [
    {
      id: "b2000000-0000-4000-8000-000000000001",
      name: "Оператори реєстру",
      slug: "registry-operators",
      description: "Типові повноваження оператора реєстру",
    },
    {
      id: "b2000000-0000-4000-8000-000000000002",
      name: "Аналітики",
      slug: "analysts",
      description: "Доступ до аналітики",
    },
    {
      id: "b2000000-0000-4000-8000-000000000003",
      name: "Безпека",
      slug: "security",
      description: "Керування політиками та аудитом (без даних реєстру)",
    },
  ] as const;

  for (const group of groupSeeds) {
    await prisma.group.upsert({
      where: { slug: group.slug },
      update: { name: group.name, description: group.description },
      create: group,
    });
  }

  const groupPermLinks: Array<{ slug: string; code: string }> = [
    { slug: "registry-operators", code: "registry.read" },
    { slug: "registry-operators", code: "registry.write" },
    { slug: "analysts", code: "analytics.read" },
    { slug: "security", code: "security.audit" },
  ];

  for (const link of groupPermLinks) {
    const group = await prisma.group.findUnique({ where: { slug: link.slug } });
    const permission = await prisma.permission.findUnique({ where: { code: link.code } });

    if (!group || !permission) continue;

    await prisma.groupPermission.upsert({
      where: {
        groupId_permissionId: { groupId: group.id, permissionId: permission.id },
      },
      update: {},
      create: { groupId: group.id, permissionId: permission.id },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
