import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { DocumentsService } from "./documents.service.js";

const IdParamSchema = z.string().uuid();

const ListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(500).default(20),
  status: z.string().optional(),
  employeeCode: z.coerce.number().int().positive().optional(),
  employeePlaceCode: z.coerce.number().int().positive().optional(),
});

const DocumentCreateSchema = z.object({
  number: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  category: z.string().optional(),
  typeLabel: z.string().min(1),
  title: z.string().min(1),
  status: z
    .enum(["draft", "review", "sign", "done", "cancelled"])
    .optional(),
  basis: z.string().max(10).optional(),
  employeeCode: z.number().int().positive(),
  placeCode: z.number().int().positive().optional(),
  employeePlaceCode: z.number().int().positive().optional(),
});

const DocumentUpdateStatusSchema = z.object({
  status: z.enum(["draft", "review", "sign", "done", "cancelled"]),
});

@Controller("/api/documents")
export class DocumentsController {
  constructor(
    @Inject(DocumentsService) private readonly documents: DocumentsService,
  ) {}

  @Get("/")
  async list(@Query() query: unknown, @Res() res: Response) {
    const parsed = ListQuerySchema.safeParse(query);

    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid query", details: parsed.error });

    return res.status(200).json(await this.documents.listDocuments(parsed.data));
  }

  @Get("/:id")
  async get(@Param("id") idParam: string, @Res() res: Response) {
    const parsed = IdParamSchema.safeParse(idParam);

    if (!parsed.success)
      return res.status(400).json({ message: "Invalid id" });

    const doc = await this.documents.getDocument(parsed.data);

    if (!doc) return res.status(404).json({ message: "Document not found" });

    return res.status(200).json(doc);
  }

  @Post("/")
  async create(@Body() body: unknown, @Res() res: Response) {
    const parsed = DocumentCreateSchema.safeParse(body);

    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid body", details: parsed.error });

    return res.status(201).json(await this.documents.createDocument(parsed.data));
  }

  @Patch("/:id")
  async updateStatus(
    @Param("id") idParam: string,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const idParsed = IdParamSchema.safeParse(idParam);

    if (!idParsed.success)
      return res.status(400).json({ message: "Invalid id" });

    const bodyParsed = DocumentUpdateStatusSchema.safeParse(body);

    if (!bodyParsed.success)
      return res
        .status(400)
        .json({ message: "Invalid body", details: bodyParsed.error });

    const result = await this.documents.updateDocumentStatus(
      idParsed.data,
      bodyParsed.data.status,
    );

    return res.status(200).json(result);
  }
}
