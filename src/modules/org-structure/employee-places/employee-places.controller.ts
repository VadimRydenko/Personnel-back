import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { AuthenticatedGuard } from "../../auth/guards/authenticated.guard.js";
import { EmployeePlacesService } from "./employee-places.service.js";

const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Очікується дата у форматі YYYY-MM-DD")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const OrgUnitCodeParamSchema = z.coerce.number().int().positive();
const PlaceCodeParamSchema = z.coerce.number().int().positive();

const OrderPartSchema = z
  .object({
    orderCode: z.number().int().positive().optional(),
    createOrder: z
      .object({
        orderNo: z.string().min(1).max(50),
        orderDate: DateOnlySchema,
      })
      .optional(),
  })
  .refine((v) => v.orderCode != null || v.createOrder != null, {
    message: "Потрібно передати orderCode або createOrder (orderNo + orderDate)",
  });

const AssignBodySchema = OrderPartSchema.and(
  z.object({
    employeeCode: z.number().int().positive(),
    validFrom: DateOnlySchema,
    sPlace: z.string().max(100).optional(),
    koef: z.number().min(1).optional(),
    percentRate: z.number().max(1).positive().optional(),
  }),
);

const UnassignBodySchema = OrderPartSchema.and(
  z.object({
    employeeCode: z.number().int().positive(),
    validTo: DateOnlySchema,
  }),
);

@Controller("/api/org-units/:code/places/:placeCode/employee-places")
@UseGuards(AuthenticatedGuard)
export class EmployeePlacesController {
  constructor(
    @Inject(EmployeePlacesService)
    private readonly employeePlaces: EmployeePlacesService,
  ) {}

  @Post()
  async assign(
    @Param("code") codeParam: string,
    @Param("placeCode") placeCodeParam: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const parsedCode = OrgUnitCodeParamSchema.safeParse(codeParam);
    const parsedPlaceCode = PlaceCodeParamSchema.safeParse(placeCodeParam);
    const parsed = AssignBodySchema.safeParse(body);

    if (!parsedCode.success || !parsedPlaceCode.success || !parsed.success) {
      return res.status(400).json({
        message: "Invalid parameters",
        details: parsed.success ? undefined : parsed.error.flatten(),
      });
    }

    const row = await this.employeePlaces.assignToPlace(
      parsedCode.data,
      parsedPlaceCode.data,
      {
        employeeCode: parsed.data.employeeCode,
        validFrom: parsed.data.validFrom,
        sPlace: parsed.data.sPlace,
        koef: parsed.data.koef,
        percentRate: parsed.data.percentRate,
        createOrderCode: parsed.data.orderCode,
        createOrder: parsed.data.createOrder,
      },
    );

    return res.status(201).json(row);
  }

  @Post("unassign")
  async unassign(
    @Param("code") codeParam: string,
    @Param("placeCode") placeCodeParam: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const parsedCode = OrgUnitCodeParamSchema.safeParse(codeParam);
    const parsedPlaceCode = PlaceCodeParamSchema.safeParse(placeCodeParam);
    const parsed = UnassignBodySchema.safeParse(body);

    if (!parsedCode.success || !parsedPlaceCode.success || !parsed.success) {
      return res.status(400).json({
        message: "Invalid parameters",
        details: parsed.success ? undefined : parsed.error.flatten(),
      });
    }

    const row = await this.employeePlaces.unassignFromPlace(
      parsedCode.data,
      parsedPlaceCode.data,
      {
        employeeCode: parsed.data.employeeCode,
        validTo: parsed.data.validTo,
        createOrderCode: parsed.data.orderCode,
        createOrder: parsed.data.createOrder,
      },
    );

    return res.status(200).json(row);
  }
}
