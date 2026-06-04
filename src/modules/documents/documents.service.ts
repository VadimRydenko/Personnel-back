import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type DocumentRow = {
  id: string;
  number: string;
  date: Date;
  category: string;
  typeLabel: string;
  title: string;
  status: string;
  employeeCode: number;
  employeePlaceCode: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateDocumentInput = {
  number: string;
  date: string;
  category?: string | undefined;
  typeLabel: string;
  title: string;
  status?: string | undefined;
  employeeCode: number;
  employeePlaceCode?: number | undefined;
};

const docSelect = {
  id: true,
  number: true,
  date: true,
  category: true,
  typeLabel: true,
  title: true,
  status: true,
  employeeCode: true,
  employeePlaceCode: true,

  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class DocumentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listDocuments(input: {
    q?: string | undefined;
    page: number;
    pageSize: number;
    status?: string | undefined;
    employeeCode?: number | undefined;
    employeePlaceCode?: number | undefined;
  }) {
    const where: Record<string, unknown> = {};

    if (input.status) where.status = input.status;

    if (input.employeeCode) where.employeeCode = input.employeeCode;

    if (input.employeePlaceCode) where.employeePlaceCode = input.employeePlaceCode;

    if (input.q) {
      const q = input.q.trim();

      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { number: { contains: q, mode: "insensitive" } },
        { typeLabel: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        orderBy: [{ date: "desc" }, { number: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: docSelect,
      }),
    ]);

    return { items, page: input.page, pageSize: input.pageSize, total };
  }

  async getDocument(id: string) {
    return this.prisma.document.findUnique({ where: { id }, select: docSelect });
  }

  async createDocument(input: CreateDocumentInput) {
    return this.prisma.document.create({
      data: {
        number: input.number,
        date: new Date(input.date),
        category: input.category ?? "Інше",
        typeLabel: input.typeLabel,
        title: input.title,
        status: input.status ?? "draft",
        employeeCode: input.employeeCode,
        employeePlaceCode: input.employeePlaceCode ?? null,
      },
      select: docSelect,
    });
  }
}
