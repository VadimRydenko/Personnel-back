import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CatalogModule } from "../catalog/catalog.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { EmployeePlacesController } from "./employee-places.controller.js";
import { EmployeePlacesService } from "./employee-places.service.js";

@Module({
  imports: [AuthModule, OrdersModule, CatalogModule],
  controllers: [EmployeePlacesController],
  providers: [EmployeePlacesService],
  exports: [EmployeePlacesService],
})
export class EmployeePlacesModule {}
