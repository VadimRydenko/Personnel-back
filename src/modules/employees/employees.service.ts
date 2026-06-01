import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type EmployeeRow = {
  code: number;
  lastName: string;
  firstName: string;
  middleName: string;
  signature: string;
  birthday: Date | null;
  personalNo: string | null;
  sex: string;
  idNo: string | null;
  validFrom: Date | null;
  validTo: Date;
  lastPlaceCode: number | null;
  remarks: string | null;
};

export type CreateEmployeeInput = {
  lastName: string;
  firstName: string;
  middleName?: string | undefined;
  signature?: string | undefined;
  birthday?: string | undefined;
  personalNo?: string | undefined;
  sex?: string | undefined;
  idNo?: string | undefined;
  remarks?: string | undefined;
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

@Injectable()
export class EmployeesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listEmployees(input: { q?: string; page: number; pageSize: number }) {
    const q = input.q?.trim().toLowerCase();
    const where = q
      ? {
          OR: [
            { lastName: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { middleName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: {
          code: true,
          lastName: true,
          firstName: true,
          middleName: true,
          signature: true,
          birthday: true,
          personalNo: true,
          sex: true,
          idNo: true,
          validFrom: true,
          validTo: true,
          lastPlaceCode: true,
          remarks: true,
        },
      }),
    ]);

    return { items, page: input.page, pageSize: input.pageSize, total };
  }

  async getEmployee(code: number) {
    return this.prisma.employee.findUnique({
      where: { code },
      select: {
        code: true,
        lastName: true,
        firstName: true,
        middleName: true,
        signature: true,
        birthday: true,
        personalNo: true,
        sex: true,
        idNo: true,
        validFrom: true,
        validTo: true,
        lastPlaceCode: true,
        remarks: true,
      },
    });
  }

  async createEmployee(input: CreateEmployeeInput) {
    return this.prisma.employee.create({
      data: {
        lastName: input.lastName,
        firstName: input.firstName,
        middleName: input.middleName ?? "",
        signature: input.signature ?? "",
        birthday: input.birthday ? new Date(input.birthday) : null,
        personalNo: input.personalNo ?? null,
        sex: input.sex ?? "Ч",
        idNo: input.idNo ?? null,
        remarks: input.remarks ?? null,
        nationalityCode: 1,
        fromWhereCode: 1,
        familyModeCode: 1,
      },
      select: {
        code: true,
        lastName: true,
        firstName: true,
        middleName: true,
        signature: true,
        birthday: true,
        personalNo: true,
        sex: true,
        idNo: true,
        validFrom: true,
        validTo: true,
        lastPlaceCode: true,
        remarks: true,
      },
    });
  }

  async updateEmployee(code: number, input: UpdateEmployeeInput) {
    const exists = await this.prisma.employee.findUnique({
      where: { code },
      select: { code: true },
    });

    if (!exists) return null;

    return this.prisma.employee.update({
      where: { code },
      data: {
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.middleName !== undefined && { middleName: input.middleName }),
        ...(input.signature !== undefined && { signature: input.signature }),
        ...(input.birthday !== undefined && {
          birthday: input.birthday ? new Date(input.birthday) : null,
        }),
        ...(input.personalNo !== undefined && { personalNo: input.personalNo }),
        ...(input.sex !== undefined && { sex: input.sex }),
        ...(input.idNo !== undefined && { idNo: input.idNo }),
        ...(input.remarks !== undefined && { remarks: input.remarks }),
      },
      select: {
        code: true,
        lastName: true,
        firstName: true,
        middleName: true,
        signature: true,
        birthday: true,
        personalNo: true,
        sex: true,
        idNo: true,
        validFrom: true,
        validTo: true,
        lastPlaceCode: true,
        remarks: true,
      },
    });
  }

  async deleteEmployee(code: number) {
    const exists = await this.prisma.employee.findUnique({
      where: { code },
      select: { code: true },
    });

    if (!exists) return false;

    await this.prisma.employee.delete({ where: { code } });

    return true;
  }
}
