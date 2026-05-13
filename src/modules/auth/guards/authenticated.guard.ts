import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthedRequest } from "../../../types/express-augment.js";
import { AuthContextService } from "../auth-context.service.js";

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(@Inject(AuthContextService) private readonly authContext: AuthContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const session = await this.authContext.getSession(req);

    if (!session) {
      throw new UnauthorizedException();
    }

    req.authSession = session;

    return true;
  }
}
