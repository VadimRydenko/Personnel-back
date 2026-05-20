import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { AccountsModule } from "../accounts/accounts.module.js";
import { AdminModule } from "../admin/admin.module.js";
import { BootstrapModule } from "../bootstrap/bootstrap.module.js";
import { EmployeesModule } from "../employees/employees.module.js";
import { OrgStructureModule } from "../org-structure/org-structure.module.js";
import { MeModule } from "../me/me.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BootstrapModule,
    MeModule,
    AdminModule,
    AccountsModule,
    EmployeesModule,
    OrgStructureModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
