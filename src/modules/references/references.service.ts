import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

type RefEntry = {
  key: string;
  title: string;
  description: string;
  fetch: () => Promise<{ code: number; val: string }[]>;
  count: () => Promise<number>;
  update: (code: number, val: string) => Promise<{ code: number; val: string }>;
  delete: (code: number) => Promise<{ code: number; val: string }>;
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
        update: (code, val) =>
          this.prisma.dRank.update({ where: { code }, data: { val } }),
        delete: (code) => this.prisma.dRank.delete({ where: { code } }),
      },
      {
        key: "family-modes",
        title: "Сімейний стан",
        description: "Режими сімейного стану",
        fetch: () =>
          this.prisma.dFamilyMode.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dFamilyMode.count(),
        update: (code, val) =>
          this.prisma.dFamilyMode.update({ where: { code }, data: { val } }),
        delete: (code) => this.prisma.dFamilyMode.delete({ where: { code } }),
      },
      {
        key: "orders",
        title: "Чиї накази",
        description: "Перелік підрозділів-емітентів наказів",
        fetch: () => this.prisma.dOrder.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dOrder.count(),
        update: (code, val) =>
          this.prisma.dOrder.update({ where: { code }, data: { val } }),
        delete: (code) => this.prisma.dOrder.delete({ where: { code } }),
      },
      {
        key: "place-types",
        title: "Типи посад",
        description: "Класифікатор типів посад",
        fetch: () => this.prisma.dPlace.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dPlace.count(),
        update: (code, val) =>
          this.prisma.dPlace.update({ where: { code }, data: { val } }),
        delete: (code) => this.prisma.dPlace.delete({ where: { code } }),
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

  async updateItem(key: string, code: number, val: string) {
    const entry = this.registry.find((e) => e.key === key);

    if (!entry) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    return entry.update(code, val);
  }

  async deleteItem(key: string, code: number) {
    const entry = this.registry.find((e) => e.key === key);

    if (!entry) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    return entry.delete(code);
  }
}
