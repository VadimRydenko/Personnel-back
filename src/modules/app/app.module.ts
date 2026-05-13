import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { AccountsModule } from "../accounts/accounts.module.js";
import { EmployeesModule } from "../employees/employees.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [PrismaModule, AuthModule, AccountsModule, EmployeesModule],
  controllers: [HealthController],
})
export class AppModule {}
