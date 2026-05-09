import { env } from "../../lib/env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const authPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

export async function createAuth() {
  const { betterAuth } = await import("better-auth");
  const { prismaAdapter } = await import("better-auth/adapters/prisma");

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.FRONTEND_ORIGIN],
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    database: prismaAdapter(authPrisma, {
      provider: "postgresql",
    }),
    experimental: { joins: true },
  });
}
