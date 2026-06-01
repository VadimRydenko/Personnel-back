import { Module } from "@nestjs/common";
import { CatalogModule } from "./catalog/catalog.module.js";
import { EmployeePlacesModule } from "./employee-places/employee-places.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PlacesModule } from "./places/places.module.js";
import { UnitsModule } from "./units/units.module.js";

@Module({
  imports: [
    OrdersModule,
    CatalogModule,
    PlacesModule,
    UnitsModule,
    EmployeePlacesModule,
  ],
})
export class OrgStructureModule {}
