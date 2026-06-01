import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { EmployeesService, type UpdateEmployeeInput } from "./employees.service.js";

const CodeParamSchema = z.coerce.number().int().positive();

const ListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const EmployeeCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  signature: z.string().optional(),
  birthday: z.string().optional(),
  personalNo: z.string().optional(),
  sex: z.string().max(1).optional(),
  idNo: z.string().optional(),
  remarks: z.string().optional(),
});

const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

@Controller("/api/employees")
export class EmployeesController {
  constructor(
    @Inject(EmployeesService) private readonly employees: EmployeesService,
  ) {}

  @Get("/")
  async list(@Query() query: unknown, @Res() res: Response) {
    const parsed = ListQuerySchema.safeParse(query);

    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid query", details: parsed.error });

    const { q, page, pageSize } = parsed.data;
    const listInput: { q?: string; page: number; pageSize: number } = { page, pageSize };

    if (q !== undefined) listInput.q = q;

    return res.status(200).json(await this.employees.listEmployees(listInput));
  }

  @Get("/:code")
  async get(@Param("code") codeParam: string, @Res() res: Response) {
    const parsed = CodeParamSchema.safeParse(codeParam);

    if (!parsed.success)
      return res.status(400).json({ message: "Invalid code" });

    const employee = await this.employees.getEmployee(parsed.data);

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json(employee);
  }

  @Post("/")
  async create(@Body() body: unknown, @Res() res: Response) {
    const parsed = EmployeeCreateSchema.safeParse(body);

    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid body", details: parsed.error });

    return res
      .status(201)
      .json(await this.employees.createEmployee(parsed.data));
  }

  @Put("/:code")
  async replace(
    @Param("code") codeParam: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const parsedCode = CodeParamSchema.safeParse(codeParam);
    const parsed = EmployeeCreateSchema.safeParse(body);

    if (!parsedCode.success || !parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid request", details: parsed.error });

    const updated = await this.employees.updateEmployee(
      parsedCode.data,
      parsed.data as UpdateEmployeeInput,
    );

    if (!updated)
      return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json(updated);
  }

  @Patch("/:code")
  async patch(
    @Param("code") codeParam: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const parsedCode = CodeParamSchema.safeParse(codeParam);
    const parsed = EmployeeUpdateSchema.safeParse(body);

    if (!parsedCode.success || !parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid request", details: parsed.error });

    const updated = await this.employees.updateEmployee(
      parsedCode.data,
      parsed.data as UpdateEmployeeInput,
    );

    if (!updated)
      return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json(updated);
  }

  @Delete("/:code")
  @HttpCode(204)
  async delete(@Param("code") codeParam: string, @Res() res: Response) {
    const parsed = CodeParamSchema.safeParse(codeParam);

    if (!parsed.success)
      return res.status(400).json({ message: "Invalid code" });

    const ok = await this.employees.deleteEmployee(parsed.data);

    if (!ok) return res.status(404).json({ message: "Employee not found" });

    return res.status(204).send();
  }
}
