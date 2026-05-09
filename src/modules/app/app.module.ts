import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { EmployeesModule } from "../employees/employees.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [PrismaModule, AuthModule, EmployeesModule],
  controllers: [HealthController],
})
export class AppModule {}
