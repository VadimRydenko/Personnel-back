import { Module } from "@nestjs/common";
import { MeController } from "./me.controller.js";
import { MeService } from "./me.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
