import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { generateStrongPassword } from "../../lib/password-generator.js";

export type CreateManagedUserInput = {
  email: string;
  name?: string | undefined;
  roleIds: number[];
  groupIds: string[];
  permissionIds: string[];
};

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getCatalog() {
    const [roles, groups, permissions] = await Promise.all([
      this.prisma.role.findMany({ orderBy: { id: "asc" } }),
      this.prisma.group.findMany({ orderBy: { name: "asc" } }),
      this.prisma.permission.findMany({ orderBy: { code: "asc" } }),
    ]);

    return { roles, groups, permissions };
  }

  async createManagedUser(input: CreateManagedUserInput) {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

    const [roles, groups, permissions] = await Promise.all([
      this.prisma.role.findMany({ where: { id: { in: input.roleIds } } }),
      this.prisma.group.findMany({ where: { id: { in: input.groupIds } } }),
      this.prisma.permission.findMany({ where: { id: { in: input.permissionIds } } }),
    ]);

    if (roles.length !== input.roleIds.length) {
      throw new BadRequestException("One or more roles are invalid");
    }

    if (groups.length !== input.groupIds.length) {
      throw new BadRequestException("One or more groups are invalid");
    }

    if (permissions.length !== input.permissionIds.length) {
      throw new BadRequestException("One or more permissions are invalid");
    }

    const plainPassword = generateStrongPassword(20);
    const passwordHash = await hashPassword(plainPassword);
    const userId = randomUUID();
    const accountRowId = randomUUID();
    const displayName = input.name?.trim() || normalizedEmail.split("@")[0] || "User";

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          name: displayName,
          mustChangePassword: true,
          tempPassword: passwordHash,
          passwordChangedAt: new Date(),
          roles: {
            create: input.roleIds.map((roleId) => ({
              role: { connect: { id: roleId } },
            })),
          },
          ...(input.groupIds.length
            ? {
                groups: {
                  create: input.groupIds.map((groupId) => ({
                    group: { connect: { id: groupId } },
                  })),
                },
              }
            : {}),
          ...(input.permissionIds.length
            ? {
                permissions: {
                  create: input.permissionIds.map((permissionId) => ({
                    permission: { connect: { id: permissionId } },
                  })),
                },
              }
            : {}),
        },
      });

      await tx.account.create({
        data: {
          id: accountRowId,
          userId,
          providerId: "credential",
          accountId: userId,
          password: passwordHash,
        },
      });
    });

    return {
      id: userId,
      email: normalizedEmail,
      name: displayName,
      temporaryPassword: plainPassword,
      mustChangePassword: true,
    };
  }
}
