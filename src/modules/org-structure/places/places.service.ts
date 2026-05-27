import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CatalogService } from "../catalog/catalog.service.js";
import { ManPlacesService } from "../man-places/man-places.service.js";
import { OrdersService } from "../orders/orders.service.js";
import { parseDateOnly } from "../shared/date.util.js";
import {
  PLACE_STATUS_LABELS,
  type CreatePlaceInput,
  type EnrichedPlace,
  type PlaceDetails,
  type PlaceDisplayStatus,
  type PlaceRow,
  type PlaceAssignee,
} from "./places.types.js";

@Injectable()
export class PlacesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(ManPlacesService) private readonly manPlaces: ManPlacesService,
  ) {}

  private getPlaceDisplayStatus(
    place: PlaceRow,
    activeAssigneeCount: number,
  ): PlaceDisplayStatus {
    if (place.validTo !== null) return "reduced";

    if (activeAssigneeCount <= 0) return "vacant";

    if (activeAssigneeCount < place.posCount) return "processing";

    return "occupied";
  }

  private enrichPlace(
    place: PlaceRow,
    placeTypes: Map<number, { code: number; val: string }>,
    orders: Map<number, { code: number; orderNo: string; orderDate: Date }>,
    orgUnits: Map<
      number,
      { code: number; name: string; shortName: string | null; city: string }
    >,
    assigneesByPlace: Map<number, PlaceAssignee[]>,
  ): EnrichedPlace {
    return {
      ...place,
      placeType: placeTypes.get(place.placeTypeCode) ?? null,
      createOrder: orders.get(place.createOrderCode) ?? null,
      destroyOrder:
        place.destroyOrderCode === null
          ? null
          : (orders.get(place.destroyOrderCode) ?? null),
      orgUnit: orgUnits.get(place.orgUnitCode) ?? null,
      assignees: assigneesByPlace.get(place.code) ?? [],
    };
  }

  private async loadOrgUnitsMap(codes: number[]) {
    const unique = [...new Set(codes)];

    if (unique.length === 0) {
      return new Map<
        number,
        { code: number; name: string; shortName: string | null; city: string }
      >();
    }

    const rows = await this.prisma.orgUnit.findMany({
      where: { code: { in: unique } },
      select: { code: true, name: true, shortName: true, city: true },
    });

    return new Map(rows.map((row) => [row.code, row]));
  }

  async enrichMany(places: PlaceRow[]): Promise<EnrichedPlace[]> {
    const orderCodes = places.flatMap((p) =>
      p.destroyOrderCode === null
        ? [p.createOrderCode]
        : [p.createOrderCode, p.destroyOrderCode],
    );
    const [placeTypes, orders, orgUnits, assigneesByPlace] = await Promise.all([
      this.catalog.loadPlaceTypesMap(places.map((p) => p.placeTypeCode)),
      this.orders.loadByCodes(orderCodes),
      this.loadOrgUnitsMap(places.map((p) => p.orgUnitCode)),
      this.manPlaces.loadActiveAssigneesByPlaceCodes(places.map((p) => p.code)),
    ]);

    return places.map((place) =>
      this.enrichPlace(place, placeTypes, orders, orgUnits, assigneesByPlace),
    );
  }

  private async nextSortOrder(orgUnitCode: number) {
    const agg = await this.prisma.place.aggregate({
      where: { orgUnitCode },
      _max: { sortOrder: true },
    });

    return (agg._max.sortOrder ?? 0) + 1;
  }

  async getOne(orgUnitCode: number, placeCode: number): Promise<PlaceDetails> {
    const place = await this.prisma.place.findFirst({
      where: { code: placeCode, orgUnitCode },
    });

    if (!place) {
      throw new NotFoundException(
        `Посаду з code=${placeCode} у підрозділі ${orgUnitCode} не знайдено`,
      );
    }

    const enrichedList = await this.enrichMany([place]);
    const enriched = enrichedList[0]!;

    const status = this.getPlaceDisplayStatus(
      place,
      enriched.assignees.length,
    );
    const assignee = enriched.assignees[0] ?? null;

    return {
      ...enriched,
      status,
      statusLabel: PLACE_STATUS_LABELS[status],
      title: enriched.placeType?.val?.trim() || `Посада #${placeCode}`,
      assignee,
    };
  }

  async listByOrgUnit(orgUnitCode: number, activeOnly = true) {
    const unit = await this.prisma.orgUnit.findUnique({
      where: { code: orgUnitCode },
      select: { code: true },
    });

    if (!unit) {
      throw new NotFoundException(
        `Підрозділ з code=${orgUnitCode} не знайдено`,
      );
    }

    const places = await this.prisma.place.findMany({
      where: {
        orgUnitCode,
        ...(activeOnly ? { validTo: null } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });

    return this.enrichMany(places);
  }

  async listActiveByOrgUnit(orgUnitCode: number) {
    const places = await this.prisma.place.findMany({
      where: { orgUnitCode, validTo: null },
      orderBy: { sortOrder: "asc" },
    });

    return this.enrichMany(places);
  }

  async create(
    orgUnitCode: number,
    input: CreatePlaceInput,
  ): Promise<EnrichedPlace> {
    const unit = await this.prisma.orgUnit.findUnique({
      where: { code: orgUnitCode },
    });

    if (!unit) {
      throw new NotFoundException(
        `Підрозділ з code=${orgUnitCode} не знайдено`,
      );
    }

    if (unit.validTo !== null) {
      throw new BadRequestException(
        "Неможливо додати посаду до ліквідованого підрозділу",
      );
    }

    await this.catalog.assertDPlaceExists(input.placeTypeCode);
    const createOrderCode = await this.orders.resolveCreateOrderCode(input);
    const validFrom = parseDateOnly(input.validFrom);
    const sortOrder = await this.nextSortOrder(orgUnitCode);

    const created = await this.prisma.place.create({
      data: {
        orgUnitCode,
        placeTypeCode: input.placeTypeCode,
        sortOrder,
        validFrom,
        createOrderCode,
        posCount: input.posCount ?? 1,
        isChief: input.isChief ?? false,
      },
    });

    const enriched = await this.enrichMany([created]);

    return enriched[0]!;
  }
}
