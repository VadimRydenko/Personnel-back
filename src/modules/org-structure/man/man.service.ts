import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class ManService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
}
