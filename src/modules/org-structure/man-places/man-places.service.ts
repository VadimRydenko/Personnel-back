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
import { ACTIVE_MAN_PLACE_VALID_TO } from "./man-places.constants.js";
import type {
  AssignManToPlaceInput,
  ManPlaceAssignee,
  ManPlaceRow,
  UnassignManFromPlaceInput,
} from "./man-places.types.js";

type Tx = Prisma.TransactionClient;

@Injectable()
export class ManPlacesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}

  private isActiveValidTo(validTo: Date) {
    return validTo >= ACTIVE_MAN_PLACE_VALID_TO;
  }

  /** Активні призначення для кількох посад (для PlacesService) */
  async loadActiveAssigneesByPlaceCodes(
    placeCodes: number[],
  ): Promise<Map<number, ManPlaceAssignee[]>> {
    const unique = [...new Set(placeCodes)];

    if (unique.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.manPlace.findMany({
      where: {
        placeCode: { in: unique },
        validTo: { gte: ACTIVE_MAN_PLACE_VALID_TO },
      },
      orderBy: { validFrom: "desc" },
      select: { placeCode: true, manCode: true, fullName: true },
    });

    const map = new Map<number, ManPlaceAssignee[]>();

    for (const row of rows) {
      if (row.placeCode === null) continue;

      const list = map.get(row.placeCode) ?? [];

      list.push({ manCode: row.manCode, fullName: row.fullName });
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
    man: {
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

    const fio = [man.lastName, man.firstName, man.middleName]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ");

    return fio.length > 0 ? `${fio}, ${positionLine}` : positionLine;
  }

  private async syncPlaceManCount(tx: Tx, placeCode: number) {
    const count = await tx.manPlace.count({
      where: {
        placeCode,
        validTo: { gte: ACTIVE_MAN_PLACE_VALID_TO },
      },
    });

    await tx.place.update({
      where: { code: placeCode },
      data: { manCount: count },
    });
  }

  private async syncManLastPlace(tx: Tx, manCode: number) {
    const latest = await tx.manPlace.findFirst({
      where: { manCode },
      orderBy: [{ validTo: "desc" }, { validFrom: "desc" }, { code: "desc" }],
      select: { code: true, validTo: true },
    });

    await tx.man.update({
      where: { code: manCode },
      data: {
        lastPlaceCode:
          latest && this.isActiveValidTo(latest.validTo) ? latest.code : null,
      },
    });
  }

  /** Призначення військовослужбовця на посаду (MANPLACES INSERT) */
  async assignToPlace(
    orgUnitCode: number,
    placeCode: number,
    input: AssignManToPlaceInput,
  ): Promise<ManPlaceRow> {
    await this.assertPlaceInOrgUnit(orgUnitCode, placeCode);

    const [man, place] = await Promise.all([
      this.prisma.man.findUnique({ where: { code: input.manCode } }),
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

    if (!man) {
      throw new NotFoundException(
        `Військовослужбовця з code=${input.manCode} не знайдено`,
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

    const existingOnPlace = await this.prisma.manPlace.findFirst({
      where: {
        manCode: input.manCode,
        placeCode,
        validTo: { gte: ACTIVE_MAN_PLACE_VALID_TO },
      },
    });

    if (existingOnPlace) {
      throw new ConflictException(
        "Військовослужбовець уже призначений на цю посаду",
      );
    }

    const activeOnPlaceCount = await this.prisma.manPlace.count({
      where: {
        placeCode,
        validTo: { gte: ACTIVE_MAN_PLACE_VALID_TO },
      },
    });

    if (activeOnPlaceCount >= place.posCount) {
      throw new BadRequestException(
        "Досягнуто максимальну кількість призначень на посаду (posCount)",
      );
    }

    const sPlace = input.sPlace?.trim() ?? "";
    const fullName = await this.buildAssignmentFullName(
      man,
      placeCode,
      orgUnitCode,
      place.placeTypeCode,
      sPlace,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.manPlace.updateMany({
        where: {
          manCode: input.manCode,
          validTo: { gte: ACTIVE_MAN_PLACE_VALID_TO },
        },
        data: { validTo: validFrom },
      });

      const created = await tx.manPlace.create({
        data: {
          manCode: input.manCode,
          placeCode,
          sPlace,
          orderCode,
          validFrom,
          validTo: ACTIVE_MAN_PLACE_VALID_TO,
          koef,
          percentRate,
          fullName,
        },
      });

      await this.syncPlaceManCount(tx, placeCode);
      await this.syncManLastPlace(tx, input.manCode);

      return created;
    });
  }

  /** Зняття з посади (закриття MANPLACES: TODATE < 2999-12-31) */
  async unassignFromPlace(
    orgUnitCode: number,
    placeCode: number,
    input: UnassignManFromPlaceInput,
  ): Promise<ManPlaceRow> {
    await this.assertPlaceInOrgUnit(orgUnitCode, placeCode);

    const validTo = parseDateOnly(input.validTo);

    await this.orders.resolveCreateOrderCode(input);

    const active = await this.prisma.manPlace.findFirst({
      where: {
        manCode: input.manCode,
        placeCode,
        validTo: { gte: ACTIVE_MAN_PLACE_VALID_TO },
      },
    });

    if (!active) {
      throw new NotFoundException(
        "Активне призначення цього військовослужбовця на посаду не знайдено",
      );
    }

    if (validTo < active.validFrom) {
      throw new BadRequestException(
        "Дата зняття не може бути раніше дати призначення",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.manPlace.update({
        where: { code: active.code },
        data: { validTo },
      });

      await this.syncPlaceManCount(tx, placeCode);
      await this.syncManLastPlace(tx, input.manCode);

      return updated;
    });
  }
}
