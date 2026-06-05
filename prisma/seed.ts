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

  const dOrderSeeds = [
    { code: 1,  val: "Початкові дані" },
    { code: 3,  val: "Нема даних" },
    { code: 6,  val: "СБ України" },
    { code: 7,  val: "КДБ СРСР" },
    { code: 8,  val: "МО України" },
    { code: 9,  val: "Генерального директора ФАУЗІ" },
    { code: 10, val: "МО РФ" },
    { code: 11, val: "Ком. 1 Повітряної армії" },
    { code: 12, val: "Нак. МО СРСР" },
    { code: 13, val: "МБ РФ" },
  ];

  for (const dOrder of dOrderSeeds) {
    await prisma.dOrder.upsert({
      where: { code: dOrder.code },
      update: { val: dOrder.val },
      create: dOrder,
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"dorder"', 'code'), GREATEST((SELECT MAX("code") FROM "dorder"), 1))`,
  );

  await prisma.order.upsert({
    where: { code: 1 },
    update: {},
    create: {
      code: 1,
      orderWhose: 8,
      orderNo: "1/2026",
      orderDate: new Date("2026-01-15T00:00:00.000Z"),
    },
  });

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"orders"', 'code'), GREATEST((SELECT MAX("code") FROM "orders"), 1))`,
  );

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

  const dPlaceSeeds = [
    { code: 1,  val: "начальник територіального вузла" },
    { code: 2,  val: "помічник начальника вузла по правовій роботі - юрисконсульт" },
    { code: 3,  val: "заступник начальника територіального вузла - начальник штабу" },
    { code: 4,  val: "начальник штабу - заступник начальника територіального вузла" },
    { code: 5,  val: "заступник начальника штабу" },
    { code: 6,  val: "старший офіцер" },
    { code: 7,  val: "відповідальний виконавець" },
    { code: 8,  val: "старший писар-кресляр" },
    { code: 9,  val: "писар-кресляр" },
    { code: 10, val: "технік" },
  ];

  for (const dPlace of dPlaceSeeds) {
    await prisma.dPlace.upsert({
      where: { code: dPlace.code },
      update: { val: dPlace.val },
      create: dPlace,
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"dplace"', 'code'), GREATEST((SELECT MAX("code") FROM "dplace"), 1))`,
  );

  const dNationalitySeeds = [
    { code: 10, val: "Нема даних" },
    { code: 11, val: "українці" },
    { code: 12, val: "росіяни" },
    { code: 13, val: "білоруси" },
    { code: 14, val: "молдавани" },
    { code: 15, val: "мордовці" },
    { code: 16, val: "литовці" },
    { code: 17, val: "татари" },
    { code: 18, val: "азербайджанці" },
    { code: 19, val: "поляки" },
  ];

  for (const item of dNationalitySeeds) {
    await prisma.dNationality.upsert({
      where: { code: item.code },
      update: { val: item.val },
      create: item,
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"dnationality"', 'code'), GREATEST((SELECT MAX("code") FROM "dnationality"), 1))`,
  );

  const dWhereFreeSeeds = [
    { code: 10, val: "Нема даних" },
    { code: 11, val: "запас Служби безпеки України" },
    { code: 12, val: "запас Збройних Сил України" },
    { code: 14, val: "у відставку" },
    { code: 17, val: "МО України" },
    { code: 18, val: "цивільні організації та установи" },
    { code: 19, val: "СБ України" },
    { code: 21, val: "МВС України" },
    { code: 22, val: "Національна гвардія України" },
    { code: 23, val: "Національне космічне агентство України" },
  ];

  for (const item of dWhereFreeSeeds) {
    await prisma.dWhereFree.upsert({
      where: { code: item.code },
      update: { val: item.val },
      create: item,
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"dwherefree"', 'code'), GREATEST((SELECT MAX("code") FROM "dwherefree"), 1))`,
  );

  const dFamilyModeSeeds = [
    { code: 10, val: "Нема даних" },
    { code: 11, val: "одружений" },
    { code: 12, val: "неодружений" },
    { code: 13, val: "розлучений" },
    { code: 16, val: "розлучена" },
    { code: 17, val: "одружений вдруге" },
    { code: 18, val: "удовець" },
    { code: 19, val: "заміжня" },
    { code: 20, val: "незаміжня" },
    { code: 21, val: "одружений втретє" },
  ];

  for (const item of dFamilyModeSeeds) {
    await prisma.dFamilyMode.upsert({
      where: { code: item.code },
      update: { val: item.val },
      create: item,
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"dfamilymode"', 'code'), GREATEST((SELECT MAX("code") FROM "dfamilymode"), 1))`,
  );

  const catalogCode = 10; // code=10 = "Нема даних" у всіх трьох довідниках

  const employeeSeeds = [
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

  for (const employee of employeeSeeds) {
    await prisma.employee.upsert({
      where: { idNo: employee.idNo },
      update: {
        lastName: employee.lastName,
        firstName: employee.firstName,
        middleName: employee.middleName,
        signature: employee.signature,
        personalNo: employee.personalNo,
        birthday: employee.birthday,
      },
      create: {
        lastName: employee.lastName,
        firstName: employee.firstName,
        middleName: employee.middleName,
        signature: employee.signature,
        idNo: employee.idNo,
        personalNo: employee.personalNo,
        birthday: employee.birthday,
        nationalityCode: catalogCode,
        fromWhereCode: catalogCode,
        familyModeCode: catalogCode,
        validFrom: new Date("2020-01-01T00:00:00.000Z"),
      },
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"employee"', 'code'), GREATEST((SELECT COALESCE(MAX("code"), 1) FROM "employee"), 1))`,
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
