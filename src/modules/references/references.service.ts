import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

type RefEntry = {
  key: string;
  title: string;
  description: string;
  fetch: () => Promise<{ code: number; val: string }[]>;
  count: () => Promise<number>;
};

@Injectable()
export class ReferencesService {
  private readonly registry: RefEntry[];

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    this.registry = [
      {
        key: "ranks",
        title: "Звання",
        description: "Військові та спеціальні звання",
        fetch: () => this.prisma.dRank.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dRank.count(),
      },
      {
        key: "family-modes",
        title: "Сімейний стан",
        description: "Режими сімейного стану",
        fetch: () =>
          this.prisma.dFamilyMode.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dFamilyMode.count(),
      },
      {
        key: "orders",
        title: "Чиї накази",
        description: "Перелік підрозділів-емітентів наказів",
        fetch: () => this.prisma.dOrder.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dOrder.count(),
      },
      {
        key: "place-types",
        title: "Типи посад",
        description: "Класифікатор типів посад",
        fetch: () => this.prisma.dPlace.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dPlace.count(),
      },
    ];
  }

  async listMeta() {
    const counts = await Promise.all(this.registry.map((e) => e.count()));

    return this.registry.map((e, i) => ({
      key: e.key,
      title: e.title,
      description: e.description,
      count: counts[i],
    }));
  }

  async listItems(key: string) {
    const entry = this.registry.find((e) => e.key === key);

    if (!entry) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    return entry.fetch();
  }
}
