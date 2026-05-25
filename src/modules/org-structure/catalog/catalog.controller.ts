import { Controller, Get, Inject, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthenticatedGuard } from "../../auth/guards/authenticated.guard.js";
import { CatalogService } from "./catalog.service.js";

@Controller("/api/org-units")
@UseGuards(AuthenticatedGuard)
export class CatalogController {
  constructor(
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}

  @Get("/catalog")
  async getCatalog(@Res() res: Response) {
    const [unitTypes, placeTypes] = await Promise.all([
      this.catalog.listUnitTypes(),
      this.catalog.listPlaceTypes(),
    ]);

    return res.status(200).json({ unitTypes, placeTypes });
  }
}
