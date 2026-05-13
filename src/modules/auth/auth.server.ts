import { env } from "../../lib/env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  checkPasswordPolicy,
  isPasswordExpiredByMaxAge,
} from "../../lib/password-policy.js";

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
  const { APIError, createAuthMiddleware } = await import("better-auth/api");

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.FRONTEND_ORIGIN],
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
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
        passwordChangedAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },
    database: prismaAdapter(authPrisma, {
      provider: "postgresql",
    }),
    experimental: { joins: true },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/change-password" || ctx.path === "/set-password") {
          const body = (ctx.body ?? {}) as {
            newPassword?: string;
            currentPassword?: string;
          };
          const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
          const currentPassword =
            typeof body.currentPassword === "string" ? body.currentPassword : undefined;
          const check = checkPasswordPolicy(newPassword, { currentPassword });

          if (!check.ok) {
            throw new APIError("BAD_REQUEST", {
              code: check.code,
              message: check.message,
            });
          }
        }
      }),
    },
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

            await authPrisma.user.update({
              where: { id: userId },
              data: {
                mustChangePassword: false,
                tempPassword: null,
                passwordChangedAt: new Date(),
              },
            });
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            const userId = typeof session.userId === "string" ? session.userId : undefined;

            if (!userId) return;

            const user = await authPrisma.user.findUnique({
              where: { id: userId },
              select: { passwordChangedAt: true, mustChangePassword: true },
            });

            if (!user) return;

            if (!user.mustChangePassword && isPasswordExpiredByMaxAge(user.passwordChangedAt)) {
              await authPrisma.user.update({
                where: { id: userId },
                data: { mustChangePassword: true },
              });
            }
          },
        },
      },
    },
  });
}
