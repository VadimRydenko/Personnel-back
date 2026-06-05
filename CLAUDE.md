# Personnel Back — Claude Code Instructions

## Code style

- Use **function expressions** instead of function declarations:
  ```ts
  // correct
  const formatDate = (iso: string) => { ... }

  // wrong
  function formatDate(iso: string) { ... }
  ```
- NestJS controllers/services/modules are **classes** — that rule does not apply to them.
- TypeScript strict mode is on. No `any`.

## Stack

- **NestJS** (modular, each feature = one module under `src/modules/`)
- **Prisma 7** with `@prisma/adapter-pg` (native pg driver, no connection pooling at ORM level)
- **Better Auth** for session / account management
- **Zod** for all request body validation

## Database design principles

### Source of truth

The reference schema is the legacy Firebird database:
`/Users/vadymrudenko/workspace/Кадри/staff_for_pg.fdb`

A full inventory of tables, indexes, triggers, views, and procedures is in:
`/Users/vadymrudenko/workspace/Кадри/firebird_inventory_report.txt`

**Goal:** every Prisma model must be as structurally close to its Firebird counterpart as possible.
- Keep all columns that exist in Firebird unless there is a good reason to drop them.
- Adding new columns that do not exist in Firebird is allowed when necessary (e.g. `deleted_at`, `created_at`).
- Removing Firebird columns is allowed only if they are truly unused in the new system.

### Naming conventions

| Layer | Convention | Example |
|---|---|---|
| Prisma model | PascalCase, English, descriptive | `Employee`, `OrgUnit`, `EmployeePlace` |
| PostgreSQL table (`@@map`) | snake_case, close to Firebird name | `employee`, `units`, `places`, `employee_places` |
| Prisma field | camelCase | `lastName`, `orgUnitCode` |
| PostgreSQL column (`@map`) | lowercase Firebird column name | `lastname`, `unit`, `create_date` |

### Lookup / dictionary tables (D-tables)

Firebird lookup tables all follow the same pattern: `CODE INTEGER PK, VAL VARCHAR`. Map them verbatim:

```prisma
model DNationality {
  code Int    @id @default(autoincrement())
  val  String @unique

  @@map("dnationality")
}
```

## Table mapping reference

### Already implemented

| Firebird | Prisma model | PG table |
|---|---|---|
| `MAN` | `Employee` | `employee` |
| `MANPLACES` | `EmployeePlace` | `employee_places` |
| `PLACES` | `Place` | `places` |
| `UNITS` | `OrgUnit` | `units` |
| `ORDERS` | `PersonnelOrder` | `orders` |
| `DORDER` | `DOrder` | `dorder` |
| `DPLACE` | `DPlace` | `dplace` |
| `DUNIT` | `DUnit` | `dunit` |

### Not yet implemented (priority order)

#### Core lookups (implement first — required as FK targets)

| Firebird | Prisma model | PG table | Description |
|---|---|---|---|
| `DNATIONALITY` | `DNationality` | `dnationality` | Довідник національностей |
| `DFAMILYMODE` | `DFamilyMode` | `dfamilymode` | Сімейний стан |
| `DWHEREFREE` | `DWhereFree` | `dwherefree` | Звідки прийшов |
| `DRANK` | `DRank` | `drank` | Звання (довідник) |
| `DPOSTYPE` | `DPosType` | `dpostype` | Тип посади |
| `DINSTITUTE` | `DInstitute` | `dinstitute` | Навчальні заклади |
| `DEDPROFILE` | `DEdProfile` | `dedprofile` | Освітні профілі |
| `DSPECIALTY` | `DSpecialty` | `dspecialty` | Спеціальності |
| `DAWARD` | `DAward` | `daward` | Нагороди (довідник) |
| `DMEDAL` | `DMedal` | `dmedal` | Медалі (довідник) |
| `DPENALTY` | `DPenalty` | `dpenalty` | Стягнення (довідник) |
| `DPAPER` | `DPaper` | `dpaper` | Типи документів |
| `DPASWHO` | `DPasWho` | `dpaswho` | Ким виданий документ |
| `DLEAVEMODE` | `DLeaveMode` | `dleavemode` | Тип відпустки |
| `DWHATFREE` | `DWhatFree` | `dwhatfree` | Причина звільнення |
| `DCOUNTRY` | `DCountry` | `dcountry` | Країни |
| `DSPECIALWORK` | `DSpecialWork` | `dspecialwork` | Спецроботи (довідник) |

#### Personnel data

| Firebird | Prisma model | PG table | Description |
|---|---|---|---|
| `RANKS` | `Rank` | `ranks` | Присвоєння звань |
| `BEGINWORK` | `BeginWork` | `beginwork` | Прийом на службу |
| `EDUCATION` | `Education` | `education` | Освіта |
| `MARIES` | `Mary` | `maries` | Шлюби |
| `CHILDREN` | `Child` | `children` | Діти |
| `PHONES` | `Phone` | `phones` | Телефони |
| `PHOTOS` | `Photo` | `photos` | Фото |
| `PAPERS` | `Paper` | `papers` | Документи (паспорти тощо) |
| `WORKLONG` | `WorkLong` | `worklong` | Трудовий стаж |
| `VISLUGA` | `Visluga` | `visluga` | Вислуга |
| `LANGUAGES` | `Language` | `languages` | Знання мов |
| `CLASS` | `Class` | `class` | Класна кваліфікація |
| `SPECIALWORKS` | `SpecialWork` | `specialworks` | Спеціальні роботи |
| `SPETIALPREPARES` | `SpecialPrepare` | `spetialprepares` | Спецпідготовка |
| `AWARDS` | `Award` | `awards` | Нагороди |
| `MEDALS` | `Medal` | `medals` | Медалі |
| `PENALTIES` | `Penalty` | `penalties` | Стягнення |
| `LEAVES` | `Leave` | `leaves` | Відпустки |
| `ABROADS` | `Abroad` | `abroads` | Відрядження закордон |
| `FREEDATA` | `FreeData` | `freedata` | Відсутність / відрядження |
| `FUNCTIONS` | `Function` | `functions` | Обов'язки |
| `DYNAMIC` | `Dynamic` | `dynamic` | Динаміка |

#### Org structure extras

| Firebird | Prisma model | PG table | Description |
|---|---|---|---|
| `UNITSTITLES` | `UnitTitle` | `unitstitles` | Перейменування підрозділів |

#### Salary (lower priority)

| Firebird | Prisma model | PG table | Description |
|---|---|---|---|
| `SALARY_PLACE` | `SalaryPlace` | `salary_place` | Тарифна сітка посад |
| `SALARY_RANK` | `SalaryRank` | `salary_rank` | Тарифна сітка звань |
| `SALARY_TARIFFRATE` | `SalaryTariffRate` | `salary_tariffrate` | Тарифна ставка |

> Tables `IBE$*`, `STAT_*`, `FINDMAN`, `SEARCH`, `CRITERIAS`, `WEB_*` are either tooling/audit
> tables or web-access tables replaced by Better Auth — **do not migrate them**.

## Module structure

Each feature lives in `src/modules/<feature>/`:
```
<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
```

Use Zod schemas (not `class-validator`) for DTO validation. Wrap responses in a consistent shape — see existing modules for the pattern.

## Migrations

Always generate migrations with:
```bash
npx prisma migrate dev --name <descriptive-name>
```

Never edit generated migration SQL files. If a migration needs custom SQL (e.g. data backfill), add it in a separate migration step.
