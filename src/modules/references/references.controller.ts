import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard.js";
import { ReferencesService } from "./references.service.js";

const UpdateItemBodySchema = z.object({
  val: z.string().min(1, "Значення не може бути порожнім").max(255),
});

const CodeParamSchema = z.coerce.number().int().positive();

@Controller("/api/references")
@UseGuards(AuthenticatedGuard)
export class ReferencesController {
  constructor(
    @Inject(ReferencesService) private readonly refs: ReferencesService,
  ) {}

  @Get()
  listMeta() {
    return this.refs.listMeta();
  }

  @Get(":key")
  listItems(@Param("key") key: string) {
    return this.refs.listItems(key);
  }

  @Post(":key")
  async createItem(@Param("key") key: string, @Body() body: unknown) {
    const parsed = UpdateItemBodySchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    return this.refs.createItem(key, parsed.data.val);
  }

  @Put(":key/:code")
  async updateItem(
    @Param("key") key: string,
    @Param("code") codeParam: string,
    @Body() body: unknown,
  ) {
    const parsedCode = CodeParamSchema.safeParse(codeParam);

    if (!parsedCode.success) {
      throw new BadRequestException("Невалідний код запису");
    }

    const parsedBody = UpdateItemBodySchema.safeParse(body);

    if (!parsedBody.success) {
      throw new BadRequestException(parsedBody.error.message);
    }

    return this.refs.updateItem(key, parsedCode.data, parsedBody.data.val);
  }

  @Delete(":key/:code")
  async deleteItem(
    @Param("key") key: string,
    @Param("code") codeParam: string,
  ) {
    const parsedCode = CodeParamSchema.safeParse(codeParam);

    if (!parsedCode.success) {
      throw new BadRequestException("Невалідний код запису");
    }

    return this.refs.deleteItem(key, parsedCode.data);
  }
}
