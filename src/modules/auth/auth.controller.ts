import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { createAuth } from "./auth.server.js";

@Controller()
export class AuthController {
  private handlerPromise: Promise<(req: Request, res: Response) => unknown>;

  constructor() {
    this.handlerPromise = (async () => {
      const auth = await createAuth();
      const { toNodeHandler } = await import("better-auth/node");

      return toNodeHandler(auth);
    })();
  }

  @All("/api/auth/*path")
  async handle(@Req() req: Request, @Res() res: Response) {
    const handler = await this.handlerPromise;

    return handler(req, res);
  }
}
