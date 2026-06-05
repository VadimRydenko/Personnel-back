import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { OrdersService } from "../org-structure/orders/orders.service.js";
import { ACTIVE_EMPLOYEE_PLACE_VALID_TO } from "../org-structure/employee-places/employee-places.constants.js";

export type DocStatus = "draft" | "review" | "sign" | "done" | "cancelled";

export type DocumentRow = {
  id: string;
  number: string;
  date: Date;
  category: string;
  typeLabel: string;
  title: string;
  status: string;
  employeeCode: number;
  placeCode: number | null;
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
  placeCode?: number | undefined;
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
  placeCode: true,
  employeePlaceCode: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(OrdersService) private readonly orders: OrdersService,
  ) {}

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
        placeCode: input.placeCode ?? null,
        employeePlaceCode: input.employeePlaceCode ?? null,
      },
      select: docSelect,
    });
  }

  async updateDocumentStatus(id: string, status: DocStatus) {
    if (status !== "done") {
      return this.prisma.document.update({
        where: { id },
        data: { status },
        select: docSelect,
      });
    }

    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        date: true,
        status: true,
        employeeCode: true,
        placeCode: true,
      },
    });

    if (!doc) throw new NotFoundException(`Document ${id} not found`);

    if (doc.status === "done") {
      return this.getDocument(id);
    }

    const employee = await this.prisma.employee.findUnique({
      where: { code: doc.employeeCode },
      select: { lastName: true, firstName: true, middleName: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${doc.employeeCode} not found`);
    }

    const orderCode = await this.orders.resolveCreateOrderCode({
      createOrder: { orderNo: doc.number, orderDate: doc.date },
    });

    const fullName = await this.buildFullName(employee, doc.placeCode);

    return this.prisma.$transaction(async (tx) => {
      await tx.employeePlace.updateMany({
        where: {
          employeeCode: doc.employeeCode,
          validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
        },
        data: { validTo: doc.date },
      });

      const employeePlace = await tx.employeePlace.create({
        data: {
          employeeCode: doc.employeeCode,
          placeCode: doc.placeCode ?? null,
          sPlace: "",
          orderCode,
          validFrom: doc.date,
          validTo: ACTIVE_EMPLOYEE_PLACE_VALID_TO,
          fullName,
        },
      });

      const latest = await tx.employeePlace.findFirst({
        where: { employeeCode: doc.employeeCode },
        orderBy: [{ validTo: "desc" }, { validFrom: "desc" }, { code: "desc" }],
        select: { code: true, validTo: true },
      });

      await tx.employee.update({
        where: { code: doc.employeeCode },
        data: {
          lastPlaceCode:
            latest && latest.validTo >= ACTIVE_EMPLOYEE_PLACE_VALID_TO
              ? latest.code
              : null,
        },
      });

      if (doc.placeCode) {
        const count = await tx.employeePlace.count({
          where: {
            placeCode: doc.placeCode,
            validTo: { gte: ACTIVE_EMPLOYEE_PLACE_VALID_TO },
          },
        });

        await tx.place.update({
          where: { code: doc.placeCode },
          data: { manCount: count },
        });
      }

      return tx.document.update({
        where: { id },
        data: { status: "done", employeePlaceCode: employeePlace.code },
        select: docSelect,
      });
    });
  }

  private async buildFullName(
    employee: { lastName: string; firstName: string; middleName: string },
    placeCode: number | null,
  ) {
    const fio = [employee.lastName, employee.firstName, employee.middleName]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ");

    if (!placeCode) return fio;

    const place = await this.prisma.place.findUnique({
      where: { code: placeCode },
      select: { placeTypeCode: true, orgUnitCode: true },
    });

    if (!place) return fio;

    const [dplace, orgUnit] = await Promise.all([
      this.prisma.dPlace.findUnique({
        where: { code: place.placeTypeCode },
        select: { val: true },
      }),
      this.prisma.orgUnit.findUnique({
        where: { code: place.orgUnitCode },
        select: { name: true, shortName: true },
      }),
    ]);

    const placeTitle = dplace?.val?.trim() ?? `Посада #${placeCode}`;
    const unitTitle =
      orgUnit?.shortName?.trim() || orgUnit?.name?.trim() || `Підрозділ #${place.orgUnitCode}`;

    return `${fio}, ${placeTitle}, ${unitTitle}`;
  }
}
