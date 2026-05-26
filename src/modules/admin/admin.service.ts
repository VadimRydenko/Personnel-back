import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

export type SearchManagedUsersInput = {
  q?: string | undefined;
  page: number;
  pageSize: number;
};

export type PatchManagedUserInput = {
  roleIds?: number[] | undefined;
  blocked?: boolean | undefined;
  blockReason?: string | null | undefined;
};

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private assertNotSelf(actorId: string, targetUserId: string) {
    if (actorId === targetUserId) {
      throw new BadRequestException(
        "Неможливо застосувати цю дію до власного облікового запису",
      );
    }
  }

  async getCatalog() {
    const [roles, groups, permissions] = await Promise.all([
      this.prisma.role.findMany({ orderBy: { id: "asc" } }),
      this.prisma.group.findMany({ orderBy: { name: "asc" } }),
      this.prisma.permission.findMany({ orderBy: { code: "asc" } }),
    ]);

    return { roles, groups, permissions };
  }

  async searchUsers(input: SearchManagedUsersInput) {
    const q = input.q?.trim() ?? "";
    const where =
      q.length > 0
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          blocked: true,
          blockReason: true,
          mustChangePassword: true,
          createdAt: true,
          roles: { select: { role: { select: { id: true, roleName: true } } } },
        },
      }),
    ]);

    return {
      items: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        blocked: u.blocked,
        blockReason: u.blockReason,
        mustChangePassword: u.mustChangePassword,
        createdAt: u.createdAt.toISOString(),
        roles: u.roles.map((r) => ({
          id: r.role.id,
          roleName: r.role.roleName,
        })),
      })),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        manCode: true,
        name: true,
        blocked: true,
        blockReason: true,
        mustChangePassword: true,
        passwordChangedAt: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: { select: { id: true, roleName: true, notes: true } },
          },
        },
        groups: {
          select: {
            group: { select: { id: true, name: true, slug: true } },
          },
        },
        permissions: {
          select: {
            permission: { select: { id: true, code: true, label: true } },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      manCode: user.manCode,
      name: user.name,
      blocked: user.blocked,
      blockReason: user.blockReason,
      mustChangePassword: user.mustChangePassword,
      passwordChangedAt: user.passwordChangedAt
        ? user.passwordChangedAt.toISOString()
        : null,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      roles: user.roles.map((r) => ({
        id: r.role.id,
        roleName: r.role.roleName,
        notes: r.role.notes,
      })),
      groups: user.groups.map((g) => ({
        id: g.group.id,
        name: g.group.name,
        slug: g.group.slug,
      })),
      directPermissions: user.permissions.map((p) => ({
        id: p.permission.id,
        code: p.permission.code,
        label: p.permission.label,
      })),
    };
  }

  async patchUser(
    actorId: string,
    userId: string,
    input: PatchManagedUserInput,
  ) {
    this.assertNotSelf(actorId, userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("Користувача не знайдено");
    }

    if (input.roleIds !== undefined) {
      if (input.roleIds.length === 0) {
        throw new BadRequestException("Потрібна хоча б одна роль");
      }

      const roles = await this.prisma.role.findMany({
        where: { id: { in: input.roleIds } },
      });

      if (roles.length !== input.roleIds.length) {
        throw new BadRequestException("Одна або кілька ролей недійсні");
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (input.roleIds !== undefined) {
        await tx.userRole.deleteMany({ where: { userId } });
        await tx.userRole.createMany({
          data: input.roleIds.map((roleId) => ({ userId, roleId })),
        });
      }

      if (input.blocked !== undefined || input.blockReason !== undefined) {
        if (input.blocked === undefined) {
          throw new BadRequestException(
            "Параметр blocked обов'язковий при зміні стану блокування або причини",
          );
        }

        const blocked = input.blocked;
        const blockReason = blocked ? (input.blockReason ?? null) : null;

        await tx.user.update({
          where: { id: userId },
          data: { blocked, blockReason },
        });

        if (blocked) {
          await tx.session.deleteMany({ where: { userId } });
        }
      }
    });

    return this.getUserById(userId);
  }

  async resetUserPassword(actorId: string, userId: string) {
    this.assertNotSelf(actorId, userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, blocked: true },
    });

    if (!user) {
      throw new NotFoundException("Користувача не знайдено");
    }

    if (user.blocked) {
      throw new ForbiddenException(
        "Неможливо скинути пароль заблокованому користувачу",
      );
    }

    const account = await this.prisma.account.findFirst({
      where: { userId, providerId: "credential" },
      select: { id: true },
    });

    if (!account) {
      throw new BadRequestException(
        "У користувача немає облікового запису з паролем (credential)",
      );
    }

    const plainPassword = generateStrongPassword(20);
    const passwordHash = await hashPassword(plainPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: account.id },
        data: { password: passwordHash },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          mustChangePassword: true,
          tempPassword: passwordHash,
          passwordChangedAt: new Date(),
        },
      });

      await tx.session.deleteMany({ where: { userId } });
    });

    return { temporaryPassword: plainPassword };
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
      this.prisma.permission.findMany({
        where: { id: { in: input.permissionIds } },
      }),
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
    const displayName =
      input.name?.trim() || normalizedEmail.split("@")[0] || "User";

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          name: displayName,
          mustChangePassword: true,
          tempPassword: passwordHash,
          passwordChangedAt: new Date(),
          blocked: false,
          blockReason: null,
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
