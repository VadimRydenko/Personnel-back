import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ReferencesController } from "./references.controller.js";
import { ReferencesService } from "./references.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ReferencesController],
  providers: [ReferencesService],
})
export class ReferencesModule {}
