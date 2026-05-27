import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CatalogModule } from "../catalog/catalog.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { ManPlacesController } from "./man-places.controller.js";
import { ManPlacesService } from "./man-places.service.js";

@Module({
  imports: [AuthModule, OrdersModule, CatalogModule],
  controllers: [ManPlacesController],
  providers: [ManPlacesService],
  exports: [ManPlacesService],
})
export class ManPlacesModule {}
