import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import { env } from "../lib/env.js";
import { employeesRouter } from "./routes/employees.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/employees", employeesRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError) {
      return res.status(400).json({ message: "Invalid JSON" });
    }

    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

