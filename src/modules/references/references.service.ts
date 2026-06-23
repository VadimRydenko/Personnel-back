import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

type RefEntry = {
  key: string;
  title: string;
  description: string;
  fetch: () => Promise<{ code: number; val: string }[]>;
  count: () => Promise<number>;
  create: (val: string) => Promise<{ code: number; val: string }>;
  update: (code: number, val: string) => Promise<{ code: number; val: string }>;
  delete: (code: number) => Promise<{ code: number; val: string }>;
};

const HARDCODED_KEYS = new Set(["ranks", "family-modes", "orders", "place-types"]);

@Injectable()
export class ReferencesService {
  private readonly hardcoded: RefEntry[];

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    this.hardcoded = [
      {
        key: "ranks",
        title: "Звання",
        description: "Військові та спеціальні звання",
        fetch: () => this.prisma.dRank.findMany({ orderBy: { code: "asc" } }),
        count: () => this.prisma.dRank.count(),
        create: (val) => this.prisma.dRank.create({ data: { val } }),
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
        create: (val) => this.prisma.dFamilyMode.create({ data: { val } }),
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
        create: (val) => this.prisma.dOrder.create({ data: { val } }),
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
        create: (val) => this.prisma.dPlace.create({ data: { val } }),
        update: (code, val) =>
          this.prisma.dPlace.update({ where: { code }, data: { val } }),
        delete: (code) => this.prisma.dPlace.delete({ where: { code } }),
      },
    ];
  }

  private makeDynamicEntry(dir: {
    key: string;
    title: string;
    description: string;
  }): RefEntry {
    const key = dir.key;

    return {
      key,
      title: dir.title,
      description: dir.description,
      fetch: async () => {
        const rows = await this.prisma.refItem.findMany({
          where: { directoryKey: key },
          orderBy: { id: "asc" },
        });

        return rows.map((r) => ({ code: r.id, val: r.val }));
      },
      count: () => this.prisma.refItem.count({ where: { directoryKey: key } }),
      create: async (val) => {
        const row = await this.prisma.refItem.create({
          data: { directoryKey: key, val },
        });

        return { code: row.id, val: row.val };
      },
      update: async (code, val) => {
        const row = await this.prisma.refItem.update({
          where: { id: code, directoryKey: key },
          data: { val },
        });

        return { code: row.id, val: row.val };
      },
      delete: async (code) => {
        const row = await this.prisma.refItem.delete({
          where: { id: code, directoryKey: key },
        });

        return { code: row.id, val: row.val };
      },
    };
  }

  private async buildRegistry(): Promise<RefEntry[]> {
    const dynamic = await this.prisma.refDirectory.findMany({
      orderBy: { createdAt: "asc" },
    });

    return [...this.hardcoded, ...dynamic.map((d) => this.makeDynamicEntry(d))];
  }

  async listMeta() {
    const registry = await this.buildRegistry();
    const counts = await Promise.all(registry.map((e) => e.count()));

    return registry.map((e, i) => ({
      key: e.key,
      title: e.title,
      description: e.description,
      count: counts[i],
    }));
  }

  async listItems(key: string) {
    const registry = await this.buildRegistry();
    const entry = registry.find((e) => e.key === key);

    if (!entry) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    return entry.fetch();
  }

  async createItem(key: string, val: string) {
    const registry = await this.buildRegistry();
    const entry = registry.find((e) => e.key === key);

    if (!entry) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    return entry.create(val);
  }

  async updateItem(key: string, code: number, val: string) {
    const registry = await this.buildRegistry();
    const entry = registry.find((e) => e.key === key);

    if (!entry) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    return entry.update(code, val);
  }

  async deleteItem(key: string, code: number) {
    const registry = await this.buildRegistry();
    const entry = registry.find((e) => e.key === key);

    if (!entry) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    return entry.delete(code);
  }

  async createReference(title: string, description: string) {
    const key =
      title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || `ref-${Date.now()}`;

    if (HARDCODED_KEYS.has(key)) {
      throw new ConflictException(`Довідник з ключем "${key}" вже існує`);
    }

    const existing = await this.prisma.refDirectory.findUnique({ where: { key } });

    if (existing) {
      throw new ConflictException(`Довідник з ключем "${key}" вже існує`);
    }

    return this.prisma.refDirectory.create({ data: { key, title, description } });
  }

  async deleteReference(key: string) {
    if (HARDCODED_KEYS.has(key)) {
      throw new BadRequestException(`Довідник "${key}" не можна видалити`);
    }

    const existing = await this.prisma.refDirectory.findUnique({ where: { key } });

    if (!existing) throw new NotFoundException(`Довідник "${key}" не знайдено`);

    await this.prisma.refDirectory.delete({ where: { key } });
  }
}
