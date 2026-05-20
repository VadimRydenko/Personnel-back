import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

const orderSelect = { code: true, orderNo: true, orderDate: true } as const;
const unitTypeSelect = { code: true, val: true, valGenitive: true } as const;
const placeTypeSelect = { code: true, val: true } as const;

type OrgUnitRow = {
  code: number;
  parentCode: number | null;
  unitTypeCode: number;
  name: string;
  sortOrder: number;
  validFrom: Date;
  validTo: Date | null;
  createOrderCode: number;
  destroyOrderCode: number | null;
  stationing: string;
};

type StaffPlaceRow = {
  code: number;
  orgUnitCode: number;
  placeTypeCode: number;
  sortOrder: number;
  posCount: number;
  isChief: boolean;
  manCount: number;
  validFrom: Date;
  validTo: Date | null;
  createOrderCode: number;
  destroyOrderCode: number | null;
};

export type CreateOrgUnitInput = {
  parentCode?: number | null | undefined;
  unitTypeCode: number;
  name: string;
  createOrderCode?: number | undefined;
  createOrder?: { orderNo: string; orderDate: Date } | undefined;
  validFrom: Date;
  stationing?: string | undefined;
};

export type CreateStaffPlaceInput = {
  placeTypeCode: number;
  createOrderCode: number;
  validFrom: Date;
  posCount?: number | undefined;
  isChief?: boolean | undefined;
};

@Injectable()
export class OrgStructureService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private parseDateOnly(value: Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  private async loadOrders(codes: number[]) {
    const unique = [...new Set(codes)];

    if (unique.length === 0) return new Map<number, { code: number; orderNo: string; orderDate: Date }>();

    const rows = await this.prisma.personnelOrder.findMany({
      where: { code: { in: unique } },
      select: orderSelect,
    });

    return new Map(rows.map((row) => [row.code, row]));
  }

  private async loadUnitTypes(codes: number[]) {
    const unique = [...new Set(codes)];

    if (unique.length === 0) {
      return new Map<number, { code: number; val: string; valGenitive: string }>();
    }

    const rows = await this.prisma.dUnit.findMany({
      where: { code: { in: unique } },
      select: unitTypeSelect,
    });

    return new Map(rows.map((row) => [row.code, row]));
  }

  private async loadPlaceTypes(codes: number[]) {
    const unique = [...new Set(codes)];

    if (unique.length === 0) return new Map<number, { code: number; val: string }>();

    const rows = await this.prisma.dPlace.findMany({
      where: { code: { in: unique } },
      select: placeTypeSelect,
    });

    return new Map(rows.map((row) => [row.code, row]));
  }

  private enrichOrgUnit(
    unit: OrgUnitRow,
    unitTypes: Map<number, { code: number; val: string; valGenitive: string }>,
    orders: Map<number, { code: number; orderNo: string; orderDate: Date }>,
  ) {
    return {
      ...unit,
      unitType: unitTypes.get(unit.unitTypeCode) ?? null,
      createOrder: orders.get(unit.createOrderCode) ?? null,
      destroyOrder:
        unit.destroyOrderCode === null ? null : (orders.get(unit.destroyOrderCode) ?? null),
    };
  }

  private enrichStaffPlace(
    place: StaffPlaceRow,
    placeTypes: Map<number, { code: number; val: string }>,
    orders: Map<number, { code: number; orderNo: string; orderDate: Date }>,
  ) {
    return {
      ...place,
      placeType: placeTypes.get(place.placeTypeCode) ?? null,
      createOrder: orders.get(place.createOrderCode) ?? null,
      destroyOrder:
        place.destroyOrderCode === null ? null : (orders.get(place.destroyOrderCode) ?? null),
    };
  }

  private async enrichOrgUnits(units: OrgUnitRow[]) {
    const orderCodes = units.flatMap((u) =>
      u.destroyOrderCode === null ? [u.createOrderCode] : [u.createOrderCode, u.destroyOrderCode],
    );
    const [unitTypes, orders] = await Promise.all([
      this.loadUnitTypes(units.map((u) => u.unitTypeCode)),
      this.loadOrders(orderCodes),
    ]);

    return units.map((unit) => this.enrichOrgUnit(unit, unitTypes, orders));
  }

  private async enrichStaffPlaces(places: StaffPlaceRow[]) {
    const orderCodes = places.flatMap((p) =>
      p.destroyOrderCode === null ? [p.createOrderCode] : [p.createOrderCode, p.destroyOrderCode],
    );
    const [placeTypes, orders] = await Promise.all([
      this.loadPlaceTypes(places.map((p) => p.placeTypeCode)),
      this.loadOrders(orderCodes),
    ]);

    return places.map((place) => this.enrichStaffPlace(place, placeTypes, orders));
  }

  private async assertOrderExists(code: number) {
    const order = await this.prisma.personnelOrder.findUnique({ where: { code } });

    if (!order) {
      throw new BadRequestException(`Наказ з code=${code} не знайдено`);
    }
  }

  private async ensureDefaultOrderWhoseCode(): Promise<number> {
    const existing = await this.prisma.dOrder.findFirst({ orderBy: { code: "asc" }, select: { code: true } });

    if (existing) return existing.code;

    const created = await this.prisma.dOrder.create({
      data: { val: "Наказ" },
      select: { code: true },
    });

    return created.code;
  }

  private async resolveCreateOrderCode(input: CreateOrgUnitInput): Promise<number> {
    if (input.createOrderCode != null) {
      await this.assertOrderExists(input.createOrderCode);

      return input.createOrderCode;
    }

    if (!input.createOrder) {
      throw new BadRequestException("Потрібно передати createOrderCode або createOrder (orderNo + orderDate)");
    }

    const orderWhose = await this.ensureDefaultOrderWhoseCode();
    const orderDate = this.parseDateOnly(input.createOrder.orderDate);
    const orderNo = input.createOrder.orderNo.trim();

    const existing = await this.prisma.personnelOrder.findFirst({
      where: { orderWhose, orderNo, orderDate },
      select: { code: true },
    });

    if (existing) return existing.code;

    const created = await this.prisma.personnelOrder.create({
      data: { orderWhose, orderNo, orderDate },
      select: { code: true },
    });

    return created.code;
  }

  private async assertDUnitExists(code: number) {
    const row = await this.prisma.dUnit.findUnique({ where: { code } });

    if (!row) {
      throw new BadRequestException(`Тип підрозділу (dunit) з code=${code} не знайдено`);
    }
  }

  private async assertDPlaceExists(code: number) {
    const row = await this.prisma.dPlace.findUnique({ where: { code } });

    if (!row) {
      throw new BadRequestException(`Тип посади (dplace) з code=${code} не знайдено`);
    }
  }

  private async assertParentExists(parentCode: number) {
    const parent = await this.prisma.orgUnit.findUnique({ where: { code: parentCode } });

    if (!parent) {
      throw new NotFoundException(`Батьківський підрозділ з code=${parentCode} не знайдено`);
    }

    if (parent.validTo !== null) {
      throw new BadRequestException("Неможливо додати дочірній підрозділ до ліквідованого підрозділу");
    }
  }

  private async nextUnitSortOrder(parentCode: number | null) {
    const agg = await this.prisma.orgUnit.aggregate({
      where: { parentCode },
      _max: { sortOrder: true },
    });

    return (agg._max.sortOrder ?? 0) + 1;
  }

  private async nextPlaceSortOrder(orgUnitCode: number) {
    const agg = await this.prisma.staffPlace.aggregate({
      where: { orgUnitCode },
      _max: { sortOrder: true },
    });

    return (agg._max.sortOrder ?? 0) + 1;
  }

  async listOrgUnits(input: { parentCode?: number | null | undefined; activeOnly?: boolean }) {
    const where: {
      parentCode?: number | null;
      validTo?: null;
    } = {};

    if (input.parentCode !== undefined) {
      where.parentCode = input.parentCode;
    }

    if (input.activeOnly !== false) {
      where.validTo = null;
    }

    const units = await this.prisma.orgUnit.findMany({
      where,
      orderBy: [{ parentCode: "asc" }, { sortOrder: "asc" }],
    });

    return this.enrichOrgUnits(units);
  }

  async listUnitTypes() {
    return this.prisma.dUnit.findMany({
      orderBy: { val: "asc" },
      select: { code: true, val: true, valGenitive: true },
    });
  }

  async getOrgUnit(code: number) {
    const unit = await this.prisma.orgUnit.findUnique({
      where: { code },
      include: {
        children: {
          where: { validTo: null },
          orderBy: { sortOrder: "asc" },
        },
        places: {
          where: { validTo: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Підрозділ з code=${code} не знайдено`);
    }

    const { children, places, ...root } = unit;
    const [enrichedRoot] = await this.enrichOrgUnits([root]);
    const enrichedChildren = await this.enrichOrgUnits(children);
    const enrichedPlaces = await this.enrichStaffPlaces(places);

    return {
      ...enrichedRoot,
      children: enrichedChildren,
      places: enrichedPlaces,
    };
  }

  async createOrgUnit(input: CreateOrgUnitInput) {
    await this.assertDUnitExists(input.unitTypeCode);
    const createOrderCode = await this.resolveCreateOrderCode(input);

    const parentCode = input.parentCode ?? null;

    if (parentCode !== null) {
      await this.assertParentExists(parentCode);
    }

    const validFrom = this.parseDateOnly(input.validFrom);
    const sortOrder = await this.nextUnitSortOrder(parentCode);

    const name = input.name.trim();
    let stationing = input.stationing?.trim() || "Нема даних";

    if (parentCode !== null && stationing === "Нема даних") {
      const parent = await this.prisma.orgUnit.findUnique({
        where: { code: parentCode },
        select: { stationing: true },
      });

      if (parent?.stationing && parent.stationing !== "Нема даних") {
        stationing = parent.stationing;
      }
    }

    const created = await this.prisma.orgUnit.create({
      data: {
        parentCode,
        unitTypeCode: input.unitTypeCode,
        name,
        sortOrder,
        validFrom,
        createOrderCode,
        stationing,
      },
    });

    const [enriched] = await this.enrichOrgUnits([created]);

    return enriched;
  }

  async listStaffPlaces(orgUnitCode: number, activeOnly = true) {
    await this.getOrgUnit(orgUnitCode);

    const places = await this.prisma.staffPlace.findMany({
      where: {
        orgUnitCode,
        ...(activeOnly ? { validTo: null } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });

    return this.enrichStaffPlaces(places);
  }

  async createStaffPlace(orgUnitCode: number, input: CreateStaffPlaceInput) {
    const unit = await this.prisma.orgUnit.findUnique({ where: { code: orgUnitCode } });

    if (!unit) {
      throw new NotFoundException(`Підрозділ з code=${orgUnitCode} не знайдено`);
    }

    if (unit.validTo !== null) {
      throw new BadRequestException("Неможливо додати посаду до ліквідованого підрозділу");
    }

    await this.assertOrderExists(input.createOrderCode);
    await this.assertDPlaceExists(input.placeTypeCode);

    const validFrom = this.parseDateOnly(input.validFrom);
    const sortOrder = await this.nextPlaceSortOrder(orgUnitCode);

    const created = await this.prisma.staffPlace.create({
      data: {
        orgUnitCode,
        placeTypeCode: input.placeTypeCode,
        sortOrder,
        validFrom,
        createOrderCode: input.createOrderCode,
        posCount: input.posCount ?? 1,
        isChief: input.isChief ?? false,
      },
    });

    const [enriched] = await this.enrichStaffPlaces([created]);

    return enriched;
  }
}
