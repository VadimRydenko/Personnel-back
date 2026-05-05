import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { EmployeesService } from "./employees.service";

const ListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const EmployeeCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().min(1).optional(),
});

const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

@Controller("/api/employees")
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get("/")
  list(@Query() query: unknown, @Res() res: Response) {
    const parsed = ListQuerySchema.safeParse(query);

    if (!parsed.success) return res.status(400).json({ message: "Invalid query", details: parsed.error });

    const data = this.employees.listEmployees(parsed.data);

    return res.status(200).json(data);
  }

  @Get("/:id")
  get(@Param("id") id: string, @Res() res: Response) {
    const employee = this.employees.getEmployee(id);

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json(employee);
  }

  @Post("/")
  create(@Body() body: unknown, @Res() res: Response) {
    const parsed = EmployeeCreateSchema.safeParse(body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid body", details: parsed.error });

    const employee = this.employees.createEmployee(parsed.data);

    return res.status(201).json(employee);
  }

  @Put("/:id")
  replace(@Param("id") id: string, @Body() body: unknown, @Res() res: Response) {
    const parsed = EmployeeCreateSchema.safeParse(body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid body", details: parsed.error });

    const updated = this.employees.updateEmployee(id, parsed.data);

    if (!updated) return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json(updated);
  }

  @Patch("/:id")
  patch(@Param("id") id: string, @Body() body: unknown, @Res() res: Response) {
    const parsed = EmployeeUpdateSchema.safeParse(body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid body", details: parsed.error });

    const updated = this.employees.updateEmployee(id, parsed.data);

    if (!updated) return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json(updated);
  }

  @Delete("/:id")
  @HttpCode(204)
  delete(@Param("id") id: string, @Res() res: Response) {
    const ok = this.employees.deleteEmployee(id);

    if (!ok) return res.status(404).json({ message: "Employee not found" });

    return res.status(204).send();
  }
}
