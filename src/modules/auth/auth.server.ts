import { env } from "../../lib/env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const authPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

let authSingleton: Awaited<ReturnType<typeof buildAuth>> | undefined;

export async function getAuth() {
  authSingleton ??= await buildAuth();

  return authSingleton;
}

async function buildAuth() {
  const { betterAuth } = await import("better-auth");
  const { prismaAdapter } = await import("better-auth/adapters/prisma");

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.FRONTEND_ORIGIN],
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    user: {
      additionalFields: {
        mustChangePassword: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
        tempPassword: {
          type: "string",
          required: false,
          input: false,
          returned: false,
        },
      },
    },
    database: prismaAdapter(authPrisma, {
      provider: "postgresql",
    }),
    experimental: { joins: true },
    databaseHooks: {
      account: {
        update: {
          after: async (account) => {
            let userId = typeof account.userId === "string" ? account.userId : undefined;

            if (!userId && typeof account.id === "string") {
              const row = await authPrisma.account.findUnique({
                where: { id: account.id },
                select: { userId: true },
              });

              userId = row?.userId;
            }

            if (!userId) return;

            const user = await authPrisma.user.findUnique({
              where: { id: userId },
              select: { mustChangePassword: true },
            });

            if (user?.mustChangePassword) {
              await authPrisma.user.update({
                where: { id: userId },
                data: { mustChangePassword: false, tempPassword: null },
              });
            }
          },
        },
      },
    },
  });
}
