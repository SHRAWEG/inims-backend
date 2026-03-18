import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { UserContext } from '@common/types/user-context.type';
import { UnauthorizedException } from '@common/exceptions/unauthorized.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    try {
      const result = (await super.canActivate(context)) as boolean;
      if (!result) return false;

      // After successful auth, set userId in CLS for audit logging
      const req = context.switchToHttp().getRequest<Record<string, any>>();
      const user = req.user as UserContext | undefined;
      this.cls.set('userId', user?.id ?? null);

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
