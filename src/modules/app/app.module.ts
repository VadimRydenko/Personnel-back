import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { EmployeesModule } from "../employees/employees.module";

@Module({
  imports: [EmployeesModule],
  controllers: [HealthController],
})
export class AppModule {}
