import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class MeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        groups: {
          include: {
            group: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        permissions: { include: { permission: true } },
      },
    });

    if (!user) {
      return null;
    }

    const effectiveCodes = new Set<string>();

    for (const ug of user.groups) {
      for (const gp of ug.group.permissions) {
        effectiveCodes.add(gp.permission.code);
      }
    }

    for (const up of user.permissions) {
      effectiveCodes.add(up.permission.code);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      mustChangePassword: user.mustChangePassword,
      passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.toISOString() : null,
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
      effectivePermissionCodes: [...effectiveCodes].sort(),
    };
  }
}
