import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard.js";
import { ReferencesService } from "./references.service.js";

@Controller("/api/references")
@UseGuards(AuthenticatedGuard)
export class ReferencesController {
  constructor(
    @Inject(ReferencesService) private readonly refs: ReferencesService,
  ) {}

  @Get()
  listMeta() {
    return this.refs.listMeta();
  }

  @Get(":key")
  listItems(@Param("key") key: string) {
    return this.refs.listItems(key);
  }
}
