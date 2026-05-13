import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { AppAuthSession } from "../../types/express-augment.js";
import { getAuth } from "./auth.server.js";

@Injectable()
export class AuthContextService {
  async getSession(req: Request): Promise<AppAuthSession | null> {
    const auth = await getAuth();
    const { fromNodeHeaders } = await import("better-auth/node");

    return auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
  }
}
