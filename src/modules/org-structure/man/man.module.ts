import { Module } from "@nestjs/common";
import { ManService } from "./man.service.js";

@Module({
  providers: [ManService],
  exports: [ManService],
})
export class ManModule {}
