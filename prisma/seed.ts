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
    const permission = await prisma.permission.findUnique({
      where: { code: link.code },
    });

    if (!group || !permission) continue;

    await prisma.groupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: group.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: { groupId: group.id, permissionId: permission.id },
    });
  }

  const dOrder =
    (await prisma.dOrder.findFirst({ where: { val: "Загальний" } })) ??
    (await prisma.dOrder.create({ data: { val: "Загальний" } }));

  const existingOrder = await prisma.personnelOrder.findFirst({
    where: { orderNo: "1/2026" },
  });

  if (!existingOrder) {
    await prisma.personnelOrder.create({
      data: {
        orderWhose: dOrder.code,
        orderNo: "1/2026",
        orderDate: new Date("2026-01-15T00:00:00.000Z"),
      },
    });
  }

  const dUnitSeeds = [
    { val: "Департамент", key: "department" },
    { val: "Управління", key: "management" },
    { val: "Відділ", key: "section" },
    { val: "Сектор", key: "sector" },
  ] as const;

  for (const dUnit of dUnitSeeds) {
    await prisma.dUnit.upsert({
      where: { val: dUnit.val },
      update: { key: dUnit.key },
      create: { val: dUnit.val, key: dUnit.key },
    });
  }

  const legacyRota = await prisma.dUnit.findUnique({ where: { val: "Рота" } });
  const fallbackType = await prisma.dUnit.findUnique({
    where: { val: "Сектор" },
  });

  if (legacyRota && fallbackType) {
    await prisma.orgUnit.updateMany({
      where: { unitTypeCode: legacyRota.code },
      data: { unitTypeCode: fallbackType.code },
    });
    await prisma.dUnit.delete({ where: { code: legacyRota.code } });
  }

  await prisma.dPlace.upsert({
    where: { val: "Командир роти" },
    update: {},
    create: { val: "Командир роти" },
  });

  /** Мінімальні коди довідників (таблиці DNATIONALITY / DWHEREFREE / DFAMILYMODE ще не в PG) */
  const catalogCode = 1;

  const manSeeds = [
    {
      lastName: "Коваленко",
      firstName: "Олексій",
      middleName: "Володимирович",
      signature: "Коваленко О.В.",
      idNo: "1000000001",
      personalNo: "12345678",
      birthday: new Date("1990-05-15T00:00:00.000Z"),
    },
    {
      lastName: "Шевченко",
      firstName: "Андрій",
      middleName: "Петрович",
      signature: "Шевченко А.П.",
      idNo: "1000000002",
      personalNo: "23456789",
      birthday: new Date("1988-11-03T00:00:00.000Z"),
    },
    {
      lastName: "Мельник",
      firstName: "Ірина",
      middleName: "Сергіївна",
      signature: "Мельник І.С.",
      idNo: "1000000003",
      personalNo: "34567890",
      birthday: new Date("1992-02-20T00:00:00.000Z"),
    },
    {
      lastName: "Бондаренко",
      firstName: "Дмитро",
      middleName: "Іванович",
      signature: "Бондаренко Д.І.",
      idNo: "1000000004",
      personalNo: "45678901",
      birthday: new Date("1985-07-08T00:00:00.000Z"),
    },
    {
      lastName: "Ткаченко",
      firstName: "Наталія",
      middleName: "Олегівна",
      signature: "Ткаченко Н.О.",
      idNo: "1000000005",
      personalNo: "56789012",
      birthday: new Date("1994-12-01T00:00:00.000Z"),
    },
  ] as const;

  for (const man of manSeeds) {
    await prisma.man.upsert({
      where: { idNo: man.idNo },
      update: {
        lastName: man.lastName,
        firstName: man.firstName,
        middleName: man.middleName,
        signature: man.signature,
        personalNo: man.personalNo,
        birthday: man.birthday,
      },
      create: {
        lastName: man.lastName,
        firstName: man.firstName,
        middleName: man.middleName,
        signature: man.signature,
        idNo: man.idNo,
        personalNo: man.personalNo,
        birthday: man.birthday,
        nationalityCode: catalogCode,
        fromWhereCode: catalogCode,
        familyModeCode: catalogCode,
        validFrom: new Date("2020-01-01T00:00:00.000Z"),
      },
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"man"', 'code'), GREATEST((SELECT COALESCE(MAX("code"), 1) FROM "man"), 1))`,
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
