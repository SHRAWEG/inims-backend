import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { SystemRole } from '@common/enums/system-role.enum';
import { UserContext } from '@common/types/user-context.type';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Record<string, any>>();
    const userContext = request.user as UserContext | undefined;

    if (!userContext) return false;

    // 1. Bypass for SYSTEM_ADMIN and ADMIN
    if (
      userContext.systemRole === SystemRole.SUPER_ADMIN ||
      userContext.systemRole === SystemRole.ADMIN
    ) {
      return true;
    }

    // 2. Custom role users - must have a role assigned
    if (!userContext.roleId) return false;

    // 3. Fetch user with role and permissions to verify
    const user = await this.usersService.findById(userContext.id);

    if (!user || !user.role || !user.role.isActive) return false;

    const userPermissions = user.role.permissions.map(
      (p) => `${p.resource}:${p.action}`,
    );

    // Check if user has ALL required permissions for this route
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
