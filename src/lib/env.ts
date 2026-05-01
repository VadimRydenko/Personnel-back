import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  AUTH_MODE: z.enum(["none", "jwt", "cookie"]).default("none"),
});

export const env = EnvSchema.parse(process.env);
