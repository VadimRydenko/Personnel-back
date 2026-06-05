import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { parseDateOnly } from "../shared/date.util.js";
import type { CreateOrderInput, OrderSummary } from "./orders.types.js";

const orderSelect = { code: true, orderNo: true, orderDate: true } as const;

@Injectable()
export class OrdersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async loadByCodes(codes: number[]): Promise<Map<number, OrderSummary>> {
    const unique = [...new Set(codes)];

    if (unique.length === 0) return new Map();

    const rows = await this.prisma.order.findMany({
      where: { code: { in: unique } },
      select: orderSelect,
    });

    return new Map(rows.map((row) => [row.code, row]));
  }

  async assertExists(code: number) {
    const order = await this.prisma.order.findUnique({
      where: { code },
    });

    if (!order) {
      throw new BadRequestException(`Наказ з code=${code} не знайдено`);
    }
  }

  private async ensureDefaultOrderWhoseCode(): Promise<number> {
    const existing = await this.prisma.dOrder.findFirst({
      orderBy: { code: "asc" },
      select: { code: true },
    });

    if (existing) return existing.code;

    const created = await this.prisma.dOrder.create({
      data: { val: "Наказ" },
      select: { code: true },
    });

    return created.code;
  }

  async resolveCreateOrderCode(input: CreateOrderInput): Promise<number> {
    if (input.createOrderCode != null) {
      await this.assertExists(input.createOrderCode);

      return input.createOrderCode;
    }

    if (!input.createOrder) {
      throw new BadRequestException(
        "Потрібно передати createOrderCode або createOrder (orderNo + orderDate)",
      );
    }

    const orderWhose = await this.ensureDefaultOrderWhoseCode();
    const orderDate = parseDateOnly(input.createOrder.orderDate);
    const orderNo = input.createOrder.orderNo.trim();

    const existing = await this.prisma.order.findFirst({
      where: { orderWhose, orderNo, orderDate },
      select: { code: true },
    });

    if (existing) return existing.code;

    const created = await this.prisma.order.create({
      data: { orderWhose, orderNo, orderDate },
      select: { code: true },
    });

    return created.code;
  }
}
