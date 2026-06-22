import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { AuthenticatedGuard } from "../../auth/guards/authenticated.guard.js";
import { PlacesService } from "./places.service.js";

const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Очікується дата у форматі YYYY-MM-DD")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const OrgUnitCodeParamSchema = z.coerce.number().int().positive();
const PlaceCodeParamSchema = z.coerce.number().int().positive();

const CreatePlaceBodySchema = z
  .object({
    placeTypeCode: z.number().int().positive(),
    posTypeCode: z.number().int().positive(),
    rankCode: z.number().int().positive(),
    createOrderCode: z.number().int().positive().optional(),
    createOrder: z
      .object({
        orderNo: z.string().min(1).max(50),
        orderDate: DateOnlySchema,
      })
      .optional(),
    validFrom: DateOnlySchema,
    posCount: z.number().positive().optional(),
    isChief: z.boolean().optional(),
  })
  .refine((v) => v.createOrderCode != null || v.createOrder != null, {
    message:
      "Потрібно передати createOrderCode або createOrder (orderNo + orderDate)",
  });

@Controller("/api/org-units/:code/places")
@UseGuards(AuthenticatedGuard)
export class PlacesController {
  constructor(@Inject(PlacesService) private readonly places: PlacesService) {}

  @Get("/:placeCode")
  async getPlace(
    @Param("code") codeParam: string,
    @Param("placeCode") placeCodeParam: string,
    @Res() res: Response,
  ) {
    const parsedCode = OrgUnitCodeParamSchema.safeParse(codeParam);
    const parsedPlaceCode = PlaceCodeParamSchema.safeParse(placeCodeParam);

    if (!parsedCode.success || !parsedPlaceCode.success) {
      return res.status(400).json({ message: "Invalid unit or place code" });
    }

    const place = await this.places.getOne(
      parsedCode.data,
      parsedPlaceCode.data,
    );

    return res.status(200).json(place);
  }

  @Get()
  async listPlaces(@Param("code") codeParam: string, @Res() res: Response) {
    const parsedCode = OrgUnitCodeParamSchema.safeParse(codeParam);

    if (!parsedCode.success) {
      return res.status(400).json({ message: "Invalid unit code" });
    }

    const items = await this.places.listByOrgUnit(parsedCode.data);

    return res.status(200).json({ items });
  }

  @Post()
  async createPlace(
    @Param("code") codeParam: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const parsedCode = OrgUnitCodeParamSchema.safeParse(codeParam);

    if (!parsedCode.success) {
      return res.status(400).json({ message: "Invalid unit code" });
    }

    const parsed = CreatePlaceBodySchema.safeParse(body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const place = await this.places.create(parsedCode.data, parsed.data);

    return res.status(201).json(place);
  }
}
