import { Module } from "@nestjs/common";
import { CatalogModule } from "./catalog/catalog.module.js";
import { ManPlacesModule } from "./man-places/man-places.module.js";
import { ManModule } from "./man/man.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PlacesModule } from "./places/places.module.js";
import { UnitsModule } from "./units/units.module.js";

@Module({
  imports: [
    OrdersModule,
    CatalogModule,
    PlacesModule,
    UnitsModule,
    ManModule,
    ManPlacesModule,
  ],
})
export class OrgStructureModule {}
