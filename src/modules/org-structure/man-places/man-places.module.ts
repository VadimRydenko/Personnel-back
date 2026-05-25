import { Module } from "@nestjs/common";
import { ManPlacesService } from "./man-places.service.js";

@Module({
  providers: [ManPlacesService],
  exports: [ManPlacesService],
})
export class ManPlacesModule {}
