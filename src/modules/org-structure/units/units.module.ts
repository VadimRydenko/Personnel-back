import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CatalogModule } from "../catalog/catalog.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { PlacesModule } from "../places/places.module.js";
import { UnitsController } from "./units.controller.js";
import { UnitsService } from "./units.service.js";

@Module({
  imports: [AuthModule, OrdersModule, CatalogModule, PlacesModule],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}
