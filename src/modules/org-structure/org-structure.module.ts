import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { OrgStructureController } from "./org-structure.controller.js";
import { OrgStructureService } from "./org-structure.service.js";

@Module({
  imports: [AuthModule],
  controllers: [OrgStructureController],
  providers: [OrgStructureService],
  exports: [OrgStructureService],
})
export class OrgStructureModule {}
