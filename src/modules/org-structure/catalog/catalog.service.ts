import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

const unitTypeSelect = { code: true, val: true, key: true } as const;
const placeTypeSelect = { code: true, val: true } as const;

@Injectable()
export class CatalogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  listUnitTypes() {
    return this.prisma.dUnit.findMany({
      orderBy: { val: "asc" },
      select: unitTypeSelect,
    });
  }

  listPlaceTypes() {
    return this.prisma.dPlace.findMany({
      orderBy: { val: "asc" },
      select: placeTypeSelect,
    });
  }

  async loadUnitTypesMap(codes: number[]) {
    const unique = [...new Set(codes)];

    if (unique.length === 0) {
      return new Map<number, { code: number; val: string; key: string }>();
    }

    const rows = await this.prisma.dUnit.findMany({
      where: { code: { in: unique } },
      select: unitTypeSelect,
    });

    return new Map(rows.map((row) => [row.code, row]));
  }

  async loadPlaceTypesMap(codes: number[]) {
    const unique = [...new Set(codes)];

    if (unique.length === 0) {
      return new Map<number, { code: number; val: string }>();
    }

    const rows = await this.prisma.dPlace.findMany({
      where: { code: { in: unique } },
      select: placeTypeSelect,
    });

    return new Map(rows.map((row) => [row.code, row]));
  }

  async assertDUnitExists(code: number) {
    const row = await this.prisma.dUnit.findUnique({ where: { code } });

    if (!row) {
      throw new BadRequestException(
        `Тип підрозділу (dunit) з code=${code} не знайдено`,
      );
    }
  }

  async assertDPlaceExists(code: number) {
    const row = await this.prisma.dPlace.findUnique({ where: { code } });

    if (!row) {
      throw new BadRequestException(
        `Тип посади (dplace) з code=${code} не знайдено`,
      );
    }
  }
}
