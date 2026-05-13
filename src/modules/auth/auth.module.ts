import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthContextService } from "./auth-context.service.js";
import { AuthenticatedGuard } from "./guards/authenticated.guard.js";

@Module({
  controllers: [AuthController],
  providers: [AuthContextService, AuthenticatedGuard],
  exports: [AuthContextService, AuthenticatedGuard],
})
export class AuthModule {}
