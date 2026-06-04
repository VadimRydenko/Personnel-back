import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CatalogModule } from "../catalog/catalog.module.js";
import { EmployeePlacesModule } from "../employee-places/employee-places.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { PlacesController } from "./places.controller.js";
import { PlacesService } from "./places.service.js";
import { VacantPlacesController } from "./vacant-places.controller.js";

@Module({
  imports: [AuthModule, OrdersModule, CatalogModule, EmployeePlacesModule],
  controllers: [PlacesController, VacantPlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
