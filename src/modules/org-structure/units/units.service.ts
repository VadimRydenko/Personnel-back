import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CatalogService } from "../catalog/catalog.service.js";
import { OrdersService } from "../orders/orders.service.js";
import { PlacesService } from "../places/places.service.js";
import { parseDateOnly } from "../shared/date.util.js";
import type {
  CreateOrgUnitInput,
  EnrichedOrgUnit,
  OrgUnitRow,
  OrgUnitTreeNode,
  UpdateOrgUnitInput,
} from "./units.types.js";

@Injectable()
export class UnitsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(PlacesService) private readonly places: PlacesService,
  ) {}

  private enrichFromRow(
    unit: OrgUnitRow,
    unitTypes: Map<number, { code: number; val: string; key: string }>,
    orders: Map<number, { code: number; orderNo: string; orderDate: Date }>,
  ): EnrichedOrgUnit {
    return {
      ...unit,
      unitType: unitTypes.get(unit.unitTypeCode) ?? null,
      createOrder: orders.get(unit.createOrderCode) ?? null,
      destroyOrder:
        unit.destroyOrderCode === null
          ? null
          : (orders.get(unit.destroyOrderCode) ?? null),
    };
  }

  private sortTreeNodes(nodes: OrgUnitTreeNode[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);

    for (const node of nodes) {
      this.sortTreeNodes(node.children);
    }
  }

  private buildTree(units: EnrichedOrgUnit[]): OrgUnitTreeNode[] {
    const byCode = new Map<number, OrgUnitTreeNode>(
      units.map((unit) => [unit.code, { ...unit, children: [] }]),
    );
    const roots: OrgUnitTreeNode[] = [];

    for (const unit of byCode.values()) {
      if (unit.parentCode === null) {
        roots.push(unit);
        continue;
      }

      const parent = byCode.get(unit.parentCode);

      if (parent) {
        parent.children.push(unit);
      } else {
        roots.push(unit);
      }
    }

    this.sortTreeNodes(roots);

    return roots;
  }

  private findInTree(
    nodes: OrgUnitTreeNode[],
    code: number,
  ): OrgUnitTreeNode | null {
    for (const node of nodes) {
      if (node.code === code) return node;

      const found = this.findInTree(node.children, code);

      if (found) return found;
    }

    return null;
  }

  private async enrichMany(units: OrgUnitRow[]) {
    const orderCodes = units.flatMap((u) =>
      u.destroyOrderCode === null
        ? [u.createOrderCode]
        : [u.createOrderCode, u.destroyOrderCode],
    );
    const [unitTypes, orders] = await Promise.all([
      this.catalog.loadUnitTypesMap(units.map((u) => u.unitTypeCode)),
      this.orders.loadByCodes(orderCodes),
    ]);

    return units.map((unit) => this.enrichFromRow(unit, unitTypes, orders));
  }

  private async assertParentExists(parentCode: number) {
    const parent = await this.prisma.orgUnit.findUnique({
      where: { code: parentCode },
    });

    if (!parent) {
      throw new NotFoundException(
        `Батьківський підрозділ з code=${parentCode} не знайдено`,
      );
    }

    if (parent.validTo !== null) {
      throw new BadRequestException(
        "Неможливо додати дочірній підрозділ до ліквідованого підрозділу",
      );
    }
  }

  private async nextSortOrder(parentCode: number | null) {
    const agg = await this.prisma.orgUnit.aggregate({
      where: { parentCode },
      _max: { sortOrder: true },
    });

    return (agg._max.sortOrder ?? 0) + 1;
  }

  async listTree(input: {
    parentCode?: number | null | undefined;
    activeOnly?: boolean;
  }): Promise<OrgUnitTreeNode[]> {
    const where: { validTo?: null } = {};

    if (input.activeOnly !== false) {
      where.validTo = null;
    }

    const units = await this.prisma.orgUnit.findMany({
      where,
      orderBy: [{ parentCode: "asc" }, { sortOrder: "asc" }],
    });

    const enriched = await this.enrichMany(units);
    const tree = this.buildTree(enriched);

    if (input.parentCode === undefined || input.parentCode === null) {
      return tree;
    }

    const subtree = this.findInTree(tree, input.parentCode);

    if (!subtree) {
      throw new NotFoundException(
        `Підрозділ з code=${input.parentCode} не знайдено`,
      );
    }

    return [subtree];
  }

  async getOne(code: number) {
    const exists = await this.prisma.orgUnit.findUnique({
      where: { code },
      select: { code: true },
    });

    if (!exists) {
      throw new NotFoundException(`Підрозділ з code=${code} не знайдено`);
    }

    const tree = await this.listTree({ activeOnly: true });
    const unit = this.findInTree(tree, code);

    if (!unit) {
      throw new NotFoundException(`Підрозділ з code=${code} не знайдено`);
    }

    const places = await this.places.listActiveByOrgUnit(code);

    return { ...unit, places };
  }

  private computeShortName(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "";

    if (words.length === 1) return (words[0] ?? "").slice(0, 3).toUpperCase();

    return words.map((w) => w[0] ?? "").join("").toUpperCase();
  }

  async update(code: number, input: UpdateOrgUnitInput) {
    const existing = await this.prisma.orgUnit.findUnique({ where: { code } });

    if (!existing) {
      throw new NotFoundException(`Підрозділ з code=${code} не знайдено`);
    }

    const data: Parameters<typeof this.prisma.orgUnit.update>[0]["data"] = {};

    if (input.name != null) {
      data.name = input.name.trim();
      data.shortName = this.computeShortName(input.name.trim());
    }

    if (input.unitTypeCode != null) {
      await this.catalog.assertDUnitExists(input.unitTypeCode);
      data.unitTypeCode = input.unitTypeCode;
    }

    if (input.stationing != null) data.stationing = input.stationing.trim();

    if (input.validFrom != null) data.validFrom = parseDateOnly(input.validFrom);

    if (input.createOrder != null || input.createOrderCode != null) {
      const orderInput = {
        createOrderCode: input.createOrderCode,
        createOrder: input.createOrder,
      };
      const createOrderCode =
        await this.orders.resolveCreateOrderCode(orderInput);

      data.createOrderCode = createOrderCode;
    }

    const updated = await this.prisma.orgUnit.update({ where: { code }, data });
    const [enriched] = await this.enrichMany([updated]);

    return enriched;
  }

  async create(input: CreateOrgUnitInput) {
    await this.catalog.assertDUnitExists(input.unitTypeCode);
    const createOrderCode = await this.orders.resolveCreateOrderCode(input);

    const parentCode = input.parentCode ?? null;

    if (parentCode !== null) {
      await this.assertParentExists(parentCode);
    }

    const validFrom = parseDateOnly(input.validFrom);
    const sortOrder = await this.nextSortOrder(parentCode);

    const name = input.name.trim();
    const shortName = this.computeShortName(name);
    const stationing = input.stationing.trim();

    const created = await this.prisma.orgUnit.create({
      data: {
        parentCode,
        unitTypeCode: input.unitTypeCode,
        name,
        shortName,
        sortOrder,
        validFrom,
        createOrderCode,
        stationing,
      },
    });

    const [enriched] = await this.enrichMany([created]);

    return enriched;
  }
}
