import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../../types/express-augment.js";
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

const ListUsersQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const PatchUserBodySchema = z
  .object({
    roleIds: z.array(z.number().int().positive()).min(1).optional(),
    blocked: z.boolean().optional(),
    blockReason: z.string().max(500).nullable().optional(),
  })
  .refine(
    (d) =>
      d.roleIds !== undefined ||
      d.blocked !== undefined ||
      d.blockReason !== undefined,
    {
      message:
        "Body must include at least one of: roleIds, blocked, blockReason",
    },
  );

@Controller("/api/admin")
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get("/catalog")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async catalog(@Res() res: Response) {
    const data = await this.admin.getCatalog();

    return res.status(200).json(data);
  }

  @Get("/users")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async listUsers(@Query() query: unknown, @Res() res: Response) {
    const parsed = ListUsersQuerySchema.safeParse(query);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid query", details: parsed.error.flatten() });
    }

    const data = await this.admin.searchUsers(parsed.data);

    return res.status(200).json(data);
  }

  @Get("/users/:id")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async getUser(@Param("id") id: string, @Res() res: Response) {
    const user = await this.admin.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  }

  @Post("/users")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async createUser(@Body() body: unknown, @Res() res: Response) {
    const parsed = CreateUserBodySchema.safeParse(body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const created = await this.admin.createManagedUser(parsed.data);

    return res.status(201).json(created);
  }

  @Patch("/users/:id")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async patchUser(
    @Param("id") id: string,
    @Req() req: AuthedRequest,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const parsed = PatchUserBodySchema.safeParse(body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid body", details: parsed.error.flatten() });
    }

    const session = req.authSession;

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updated = await this.admin.patchUser(
      session.user.id,
      id,
      parsed.data,
    );

    return res.status(200).json(updated);
  }

  @Post("/users/:id/reset-password")
  @UseGuards(AuthenticatedGuard, SecurityAdminGuard)
  async resetPassword(
    @Param("id") id: string,
    @Req() req: AuthedRequest,
    @Res() res: Response,
  ) {
    const session = req.authSession;

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await this.admin.resetUserPassword(session.user.id, id);

    return res.status(200).json(result);
  }
}
