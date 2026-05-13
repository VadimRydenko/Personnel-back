import { Body, Controller, Get, Inject, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { AdminService } from "./admin.service.js";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard.js";
import { SecurityAdminGuard } from "../auth/guards/security-admin.guard.js";

const CreateUserBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
  roleIds: z.array(z.number().int().positive()).min(1),
  groupIds: z.array(z.string().uuid()).default([]),
  permissionIds: z.array(z.string().uuid()).default([]),
});

@Controller("/api/admin")
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get("/catalog")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async catalog(@Res() res: Response) {
    const data = await this.admin.getCatalog();

    return res.status(200).json(data);
  }

  @Post("/users")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async createUser(@Body() body: unknown, @Res() res: Response) {
    const parsed = CreateUserBodySchema.safeParse(body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const created = await this.admin.createManagedUser(parsed.data);

    return res.status(201).json(created);
  }
}
