import { Controller, Get, Inject, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthenticatedGuard } from "../../auth/guards/authenticated.guard.js";
import { PlacesService } from "./places.service.js";

@Controller("/api/places")
@UseGuards(AuthenticatedGuard)
export class VacantPlacesController {
  constructor(
    @Inject(PlacesService) private readonly places: PlacesService,
  ) {}

  @Get("/vacant")
  async listVacant(@Res() res: Response) {
    const items = await this.places.listVacant();

    return res.status(200).json({ items });
  }
}
