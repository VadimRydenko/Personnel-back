import { Body, Controller, Get, Inject, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard.js";
import { OrgStructureService } from "./org-structure.service.js";

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

const CreateOrgUnitBodySchema = z.object({
  parentCode: z.number().int().positive().nullable().optional(),
  unitTypeCode: z.number().int().positive(),
  name: z.string().min(1).max(120),
  createOrderCode: z.number().int().positive().optional(),
  createOrder: z
    .object({
      orderNo: z.string().min(1).max(50),
      orderDate: DateOnlySchema,
    })
    .optional(),
  validFrom: DateOnlySchema,
  stationing: z.string().min(1).max(100).optional(),
}).refine((v) => v.createOrderCode != null || v.createOrder != null, {
  message: "Потрібно передати createOrderCode або createOrder (orderNo + orderDate)",
});

const CreateStaffPlaceBodySchema = z.object({
  placeTypeCode: z.number().int().positive(),
  createOrderCode: z.number().int().positive(),
  validFrom: DateOnlySchema,
  posCount: z.number().positive().optional(),
  isChief: z.boolean().optional(),
});

@Controller("/api/org-units")
@UseGuards(AuthenticatedGuard)
export class OrgStructureController {
  constructor(@Inject(OrgStructureService) private readonly orgStructure: OrgStructureService) {}

  @Get("/catalog")
  async getCatalog(@Res() res: Response) {
    const unitTypes = await this.orgStructure.listUnitTypes();

    return res.status(200).json({ unitTypes });
  }

  @Get("/")
  async listUnits(@Query() query: unknown, @Res() res: Response) {
    const parsed = ParentQuerySchema.safeParse(query);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query", details: parsed.error.flatten() });
    }

    const items = await this.orgStructure.listOrgUnits({
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

    const unit = await this.orgStructure.getOrgUnit(code);

    return res.status(200).json(unit);
  }

  @Post("/")
  async createUnit(@Body() body: unknown, @Res() res: Response) {
    const parsed = CreateOrgUnitBodySchema.safeParse(body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const unit = await this.orgStructure.createOrgUnit(parsed.data);

    return res.status(201).json(unit);
  }

  @Get("/:code/places")
  async listPlaces(@Param("code") codeParam: string, @Res() res: Response) {
    const code = Number(codeParam);

    if (!Number.isInteger(code) || code <= 0) {
      return res.status(400).json({ message: "Invalid unit code" });
    }

    const items = await this.orgStructure.listStaffPlaces(code);

    return res.status(200).json({ items });
  }

  @Post("/:code/places")
  async createPlace(@Param("code") codeParam: string, @Body() body: unknown, @Res() res: Response) {
    const code = Number(codeParam);

    if (!Number.isInteger(code) || code <= 0) {
      return res.status(400).json({ message: "Invalid unit code" });
    }

    const parsed = CreateStaffPlaceBodySchema.safeParse(body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const place = await this.orgStructure.createStaffPlace(code, parsed.data);

    return res.status(201).json(place);
  }
}
