import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '@common/types/user-context.type';

export const CurrentUser = createParamDecorator(
  (
    data: keyof UserContext | undefined,
    ctx: ExecutionContext,
  ): UserContext | string => {
    const request = ctx.switchToHttp().getRequest<Record<string, any>>();
    const user = request.user as UserContext;
    return data ? user?.[data] : user;
  },
);
