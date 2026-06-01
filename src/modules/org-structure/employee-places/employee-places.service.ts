import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "../../../generated/prisma/client.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CatalogService } from "../catalog/catalog.service.js";
import { OrdersService } from "../orders/orders.service.js";
import { parseDateOnly } from "../shared/date.util.js";
import { ACTIVE_EMPLOYEE_PLACE_VALID_TO } from "./employee-places.constants.js";
import type {
  AssignEmployeeToPlaceInput,
  EmployeePlaceAssignee,
  EmployeePlaceRow,
  UnassignEmployeeFromPlaceInput,
} from "./employee-places.types.js";

type Tx = Prisma.TransactionClient;

@Injectable()
export class EmployeePlacesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}

  private isActiveValidTo(validTo: Date) {
    return validTo >= ACTIVE_EMPLOYEE_PLACE_VALID_TO;
  }

  /** Активні призначення для кількох посад (для PlacesService) */
  async loadActiveAssigneesByPlaceCodes(
    placeCodes: number[],
  ): Promise<Map<number, EmployeePlaceAssignee[]>> {
    const unique = [...new Set(placeCodes)];

    if (unique.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.employeePlace.findMany({
      where: {
        placeCode: { in: unique },
        validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
      },
      orderBy: { validFrom: "desc" },
      select: { placeCode: true, employeeCode: true, fullName: true },
    });

    const map = new Map<number, EmployeePlaceAssignee[]>();

    for (const row of rows) {
      if (row.placeCode === null) continue;

      const list = map.get(row.placeCode) ?? [];

      list.push({ employeeCode: row.employeeCode, fullName: row.fullName });
      map.set(row.placeCode, list);
    }

    return map;
  }

  async assertPlaceInOrgUnit(orgUnitCode: number, placeCode: number) {
    const place = await this.prisma.place.findFirst({
      where: { code: placeCode, orgUnitCode },
      select: { code: true, validTo: true },
    });

    if (!place) {
      throw new NotFoundException(
        `Посаду з code=${placeCode} у підрозділі ${orgUnitCode} не знайдено`,
      );
    }

    if (place.validTo !== null) {
      throw new BadRequestException("Неможливо працювати з ліквідованою посадою");
    }

    return place;
  }

  private async buildAssignmentFullName(
    employee: {
      lastName: string;
      firstName: string;
      middleName: string;
    },
    placeCode: number,
    orgUnitCode: number,
    placeTypeCode: number,
    sPlace: string,
  ) {
    const [placeTypes, orgUnit] = await Promise.all([
      this.catalog.loadPlaceTypesMap([placeTypeCode]),
      this.prisma.orgUnit.findUnique({
        where: { code: orgUnitCode },
        select: { name: true, shortName: true },
      }),
    ]);

    const placeTitle = placeTypes.get(placeTypeCode)?.val?.trim() ?? `Посада #${placeCode}`;
    const unitTitle =
      orgUnit?.shortName?.trim() || orgUnit?.name?.trim() || `Підрозділ #${orgUnitCode}`;
    const positionLine = `${placeTitle}, ${unitTitle}`;
    const trimmedSPlace = sPlace.trim();

    if (trimmedSPlace.length > 0) {
      return `${trimmedSPlace} за рахунок посади ${positionLine}`;
    }

    const fio = [employee.lastName, employee.firstName, employee.middleName]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ");

    return fio.length > 0 ? `${fio}, ${positionLine}` : positionLine;
  }

  private async syncPlaceEmployeeCount(tx: Tx, placeCode: number) {
    const count = await tx.employeePlace.count({
      where: {
        placeCode,
        validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
      },
    });

    await tx.place.update({
      where: { code: placeCode },
      data: { manCount: count },
    });
  }

  private async syncEmployeeLastPlace(tx: Tx, employeeCode: number) {
    const latest = await tx.employeePlace.findFirst({
      where: { employeeCode },
      orderBy: [{ validTo: "desc" }, { validFrom: "desc" }, { code: "desc" }],
      select: { code: true, validTo: true },
    });

    await tx.employee.update({
      where: { code: employeeCode },
      data: {
        lastPlaceCode:
          latest && this.isActiveValidTo(latest.validTo) ? latest.code : null,
      },
    });
  }

  async assignToPlace(
    orgUnitCode: number,
    placeCode: number,
    input: AssignEmployeeToPlaceInput,
  ): Promise<EmployeePlaceRow> {
    await this.assertPlaceInOrgUnit(orgUnitCode, placeCode);

    const [employee, place] = await Promise.all([
      this.prisma.employee.findUnique({ where: { code: input.employeeCode } }),
      this.prisma.place.findUnique({
        where: { code: placeCode },
        select: {
          code: true,
          orgUnitCode: true,
          placeTypeCode: true,
          posCount: true,
          validTo: true,
        },
      }),
    ]);

    if (!employee) {
      throw new NotFoundException(
        `Співробітника з code=${input.employeeCode} не знайдено`,
      );
    }

    if (!place || place.orgUnitCode !== orgUnitCode) {
      throw new NotFoundException(
        `Посаду з code=${placeCode} у підрозділі ${orgUnitCode} не знайдено`,
      );
    }

    const validFrom = parseDateOnly(input.validFrom);
    const orderCode = await this.orders.resolveCreateOrderCode(input);
    const koef = input.koef ?? 1;
    const percentRate = input.percentRate ?? 1;

    if (koef < 1) {
      throw new BadRequestException("koef має бути не менше 1");
    }

    if (percentRate > 1) {
      throw new BadRequestException("percentRate має бути не більше 1");
    }

    const existingOnPlace = await this.prisma.employeePlace.findFirst({
      where: {
        employeeCode: input.employeeCode,
        placeCode,
        validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
      },
    });

    if (existingOnPlace) {
      throw new ConflictException("Співробітник вже призначений на цю посаду");
    }

    const activeOnPlaceCount = await this.prisma.employeePlace.count({
      where: {
        placeCode,
        validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
      },
    });

    if (activeOnPlaceCount >= place.posCount) {
      throw new BadRequestException(
        "Досягнуто максимальну кількість призначень на посаду (posCount)",
      );
    }

    const sPlace = input.sPlace?.trim() ?? "";
    const fullName = await this.buildAssignmentFullName(
      employee,
      placeCode,
      orgUnitCode,
      place.placeTypeCode,
      sPlace,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.employeePlace.updateMany({
        where: {
          employeeCode: input.employeeCode,
          validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
        },
        data: { validTo: validFrom },
      });

      const created = await tx.employeePlace.create({
        data: {
          employeeCode: input.employeeCode,
          placeCode,
          sPlace,
          orderCode,
          validFrom,
          validTo: ACTIVE_EMPLOYEE_PLACE_VALID_TO,
          koef,
          percentRate,
          fullName,
        },
      });

      await this.syncPlaceEmployeeCount(tx, placeCode);
      await this.syncEmployeeLastPlace(tx, input.employeeCode);

      return created;
    });
  }

  async unassignFromPlace(
    orgUnitCode: number,
    placeCode: number,
    input: UnassignEmployeeFromPlaceInput,
  ): Promise<EmployeePlaceRow> {
    await this.assertPlaceInOrgUnit(orgUnitCode, placeCode);

    const validTo = parseDateOnly(input.validTo);

    await this.orders.resolveCreateOrderCode(input);

    const active = await this.prisma.employeePlace.findFirst({
      where: {
        employeeCode: input.employeeCode,
        placeCode,
        validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
      },
    });

    if (!active) {
      throw new NotFoundException(
        "Активне призначення цього співробітника на посаду не знайдено",
      );
    }

    if (validTo < active.validFrom) {
      throw new BadRequestException(
        "Дата зняття не може бути раніше дати призначення",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeePlace.update({
        where: { code: active.code },
        data: { validTo },
      });

      await this.syncPlaceEmployeeCount(tx, placeCode);
      await this.syncEmployeeLastPlace(tx, input.employeeCode);

      return updated;
    });
  }
}
