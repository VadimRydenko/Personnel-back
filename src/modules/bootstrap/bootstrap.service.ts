import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { env } from "../../lib/env.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { ACCOUNT_TYPES } from "../accounts/account-types.js";

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly log = new Logger(BootstrapService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureBootstrapAdmin();
  }

  private async ensureBootstrapAdmin() {
    const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const password = env.BOOTSTRAP_ADMIN_PASSWORD;

    if (!email) {
      return;
    }

    if (!password) {
      this.log.warn(
        "BOOTSTRAP_ADMIN_EMAIL is set but BOOTSTRAP_ADMIN_PASSWORD is missing; skipping bootstrap user",
      );

      return;
    }

    const securityRole = await this.prisma.role.findUnique({
      where: { roleName: ACCOUNT_TYPES.SECURITY_ADMIN },
    });

    if (!securityRole) {
      this.log.warn(
        "SECURITY_ADMIN role not found in database; skipping bootstrap user",
      );

      return;
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!existing) {
      const passwordHash = await hashPassword(password);
      const userId = randomUUID();
      const accountId = randomUUID();

      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: userId,
            email,
            name: "Bootstrap administrator",
            mustChangePassword: false,
            tempPassword: null,
            passwordChangedAt: new Date(),
            roles: {
              create: [{ role: { connect: { id: securityRole.id } } }],
            },
          },
        });

        await tx.account.create({
          data: {
            id: accountId,
            userId,
            providerId: "credential",
            accountId: userId,
            password: passwordHash,
          },
        });
      });

      this.log.log(`Bootstrap admin created: ${email}`);

      return;
    }

    const hasRole = await this.prisma.userRole.findFirst({
      where: { userId: existing.id, roleId: securityRole.id },
    });

    if (!hasRole) {
      await this.prisma.userRole.create({
        data: { userId: existing.id, roleId: securityRole.id },
      });
      this.log.log(`Attached SECURITY_ADMIN to existing user: ${email}`);
    }
  }
}
