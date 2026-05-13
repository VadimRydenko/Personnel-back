import { Controller, Get, Inject, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import type { AuthedRequest } from "../../types/express-augment.js";
import { MeService } from "./me.service.js";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard.js";

@Controller("/api/me")
export class MeController {
  constructor(@Inject(MeService) private readonly me: MeService) {}

  @Get("/")
  @UseGuards(AuthenticatedGuard)
  async get(@Req() req: AuthedRequest, @Res() res: Response) {
    const session = req.authSession;

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await this.me.getMe(session.user.id);

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(profile);
  }
}
