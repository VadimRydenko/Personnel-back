import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";
import { AuthModule } from "../auth/auth.module.js";
import { SecurityAdminGuard } from "../auth/guards/security-admin.guard.js";

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, SecurityAdminGuard],
})
export class AdminModule {}
