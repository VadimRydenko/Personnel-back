import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { AuthenticatedGuard } from "../../auth/guards/authenticated.guard.js";
import { UnitsService } from "./units.service.js";

const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Очікується дата у форматі YYYY-MM-DD")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const ParentQuerySchema = z.object({
  parentCode: z
    .union([z.literal("null"), z.coerce.number().int().positive()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;

      if (v === "null") return null;

      return v;
    }),
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
});

const UpdateOrgUnitBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  unitTypeCode: z.number().int().positive().optional(),
  stationing: z.string().min(1).max(100).optional(),
  validFrom: DateOnlySchema.optional(),
  createOrderCode: z.number().int().positive().optional(),
  createOrder: z
    .object({
      orderNo: z.string().min(1).max(50),
      orderDate: DateOnlySchema,
    })
    .optional(),
});

const CreateOrgUnitBodySchema = z
  .object({
    parentCode: z.number().int().positive().nullable().optional(),
    unitTypeCode: z.number().int().positive(),
    name: z.string().min(1).max(120),
    stationing: z.string().min(1).max(100),
    createOrderCode: z.number().int().positive().optional(),
    createOrder: z
      .object({
        orderNo: z.string().min(1).max(50),
        orderDate: DateOnlySchema,
      })
      .optional(),
    validFrom: DateOnlySchema,
  })
  .refine((v) => v.createOrderCode != null || v.createOrder != null, {
    message:
      "Потрібно передати createOrderCode або createOrder (orderNo + orderDate)",
  });

@Controller("/api/org-units")
@UseGuards(AuthenticatedGuard)
export class UnitsController {
  constructor(@Inject(UnitsService) private readonly units: UnitsService) {}

  @Get("/")
  async listUnits(@Query() query: unknown, @Res() res: Response) {
    const parsed = ParentQuerySchema.safeParse(query);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid query", details: parsed.error.flatten() });
    }

    const items = await this.units.listTree({
      parentCode: parsed.data.parentCode,
      activeOnly: parsed.data.activeOnly,
    });

    return res.status(200).json({ items });
  }

  @Get("/:code")
  async getUnit(@Param("code") codeParam: string, @Res() res: Response) {
    const code = Number(codeParam);

    if (!Number.isInteger(code) || code <= 0) {
      return res.status(400).json({ message: "Invalid unit code" });
    }

    const unit = await this.units.getOne(code);

    return res.status(200).json(unit);
  }

  @Put("/:code")
  async updateUnit(
    @Param("code") codeParam: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const code = Number(codeParam);

    if (!Number.isInteger(code) || code <= 0) {
      return res.status(400).json({ message: "Invalid unit code" });
    }

    const parsed = UpdateOrgUnitBodySchema.safeParse(body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const unit = await this.units.update(code, parsed.data);

    return res.status(200).json(unit);
  }

  @Post("/")
  async createUnit(@Body() body: unknown, @Res() res: Response) {
    const parsed = CreateOrgUnitBodySchema.safeParse(body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const unit = await this.units.create(parsed.data);

    return res.status(201).json(unit);
  }
}
