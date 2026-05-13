import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { AuthedRequest } from "../../../types/express-augment.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ACCOUNT_TYPES } from "../../accounts/account-types.js";

@Injectable()
export class SecurityAdminGuard implements CanActivate {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const session = req.authSession;

    if (!session?.user?.id) {
      throw new ForbiddenException();
    }

    const adminRole = await this.prisma.userRole.findFirst({
      where: {
        userId: session.user.id,
        role: { roleName: ACCOUNT_TYPES.SECURITY_ADMIN },
      },
    });

    if (!adminRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}
