# Role and Permission Based Access Control (RBAC)

This documents the Role and Permission Based Access Control pattern used across all projects.

## Architecture Overview

Three-tier access system:
- `SUPER_ADMIN` — system-level, bypasses all permission checks, cannot be assigned a custom role
- `ADMIN` — fixed full access to everything, bypasses permission checks, cannot be assigned a custom role
- Custom role users — go through permission checks based on their assigned role's permissions

Permissions follow the pattern: `resource:action`
- `resource` — the module name in kebab-case: `users`, `sectors`, `msnp-indicators`, `audit-logs`
- `action` — the operation: `view`, `create`, `update`, `delete`, plus any future actions

Both `resource` and `action` are plain strings — adding new modules or actions never requires a schema change.

## Database Schema

### `SystemRole` enum
Only two values, used for bypass logic:
```ts
export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}
```

### `roles` table
Dynamic roles created by admins:
```ts
@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions: Permission[];
}
```

### `permissions` table
Seeded at startup, never created by users:
```ts
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index(['resource', 'action'], { unique: true })
}
```

### `User` entity changes
Replace `role` enum with:
```ts
// Remove: @Column() role: UserRole

// Add:
@Column({
  type: 'enum',
  enum: SystemRole,
  nullable: true,
})
systemRole: SystemRole | null;

@Column({ type: 'uuid', nullable: true })
roleId: string | null;

@ManyToOne(() => Role, { nullable: true, eager: false })
@JoinColumn({ name: 'role_id' })
role: Role | null;
```

Rule: a user must have either `systemRole` OR `roleId` — never both, never neither. Enforce this in the service layer as a `ValidationException`.

## Permission Guard

`src/common/guards/permissions.guard.ts`:
```ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user: UserContext = req.user;

    if (
      user.systemRole === SystemRole.SUPER_ADMIN ||
      user.systemRole === SystemRole.ADMIN
    ) {
      return true;
    }

    if (!user.roleId) throw new ForbiddenException('No role assigned');

    const hasPermission = await this.rolesService.roleHasPermissions(
      user.roleId,
      required,
    );

    if (!hasPermission) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
```

## `@RequirePermissions()` decorator

`src/common/decorators/require-permissions.decorator.ts`:
```ts
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```

Usage:
```ts
@Get()
@RequirePermissions('sectors:view')
findAll() { ... }

@Post()
@RequirePermissions('sectors:create')
create() { ... }

@Patch(':id')
@RequirePermissions('sectors:update')
update() { ... }

@Delete(':id')
@RequirePermissions('sectors:delete')
remove() { ... }
```

## `UserContext` update

```ts
export interface UserContext {
  id: string;
  email: string;
  systemRole: SystemRole | null;
  roleId: string | null;
}
```

JWT strategy `validate()` must include both fields.

## Permission Seeder

Permissions are seeded at startup — never created by users. Adding a new module means adding to this list and rerunning the seeder.

`src/database/seeds/01-permissions.seeder.ts`:
```ts
const PERMISSIONS = [
  // Users
  { resource: 'users', action: 'view', description: 'View users list and details' },
  { resource: 'users', action: 'create', description: 'Create new users' },
  { resource: 'users', action: 'update', description: 'Update existing users' },
  { resource: 'users', action: 'delete', description: 'Delete users' },
  // Roles
  { resource: 'roles', action: 'view', description: 'View roles list and details' },
  { resource: 'roles', action: 'create', description: 'Create new roles' },
  { resource: 'roles', action: 'update', description: 'Update existing roles' },
  { resource: 'roles', action: 'delete', description: 'Delete roles' },
  // Sectors
  { resource: 'sectors', action: 'view' },
  { resource: 'sectors', action: 'create' },
  { resource: 'sectors', action: 'update' },
  { resource: 'sectors', action: 'delete' },
  // Types
  { resource: 'types', action: 'view' },
  { resource: 'types', action: 'create' },
  { resource: 'types', action: 'update' },
  { resource: 'types', action: 'delete' },
  // Administrative Levels
  { resource: 'administrative-levels', action: 'view' },
  { resource: 'administrative-levels', action: 'create' },
  { resource: 'administrative-levels', action: 'update' },
  { resource: 'administrative-levels', action: 'delete' },
  // Frequencies
  { resource: 'frequencies', action: 'view' },
  { resource: 'frequencies', action: 'create' },
  { resource: 'frequencies', action: 'update' },
  { resource: 'frequencies', action: 'delete' },
  // Genders
  { resource: 'genders', action: 'view' },
  { resource: 'genders', action: 'create' },
  { resource: 'genders', action: 'update' },
  { resource: 'genders', action: 'delete' },
  // Age Groups
  { resource: 'age-groups', action: 'view' },
  { resource: 'age-groups', action: 'create' },
  { resource: 'age-groups', action: 'update' },
  { resource: 'age-groups', action: 'delete' },
  // MSNP Indicators
  { resource: 'msnp-indicators', action: 'view' },
  { resource: 'msnp-indicators', action: 'create' },
  { resource: 'msnp-indicators', action: 'update' },
  { resource: 'msnp-indicators', action: 'delete' },
  // Audit Logs
  { resource: 'audit-logs', action: 'view', description: 'View audit logs' },
];
```

Seeder uses upsert on `resource + action` unique constraint — safe to run multiple times.

## Adding a new module checklist (RBAC)

When adding any new module in the future:
- [ ] Add permissions to `PERMISSIONS` array in `01-permissions.seeder.ts`
      minimum: `view`, `create`, `update`, `delete`
      add any domain-specific actions (e.g. `approve`, `publish`, `export`)
- [ ] Rerun the seeder: `npm run seed`
- [ ] Add `@RequirePermissions()` to every endpoint in the new controller
- [ ] Add permission constants to `src/lib/constants/permissions.ts` (frontend)
- [ ] Add `PermissionGate` wrappers to the new module's UI components (frontend)

## `RolesService` key methods

```ts
// Returns true if the role has ALL of the required permissions
async roleHasPermissions(roleId: string, permissions: string[]): Promise<boolean>

// Returns all permission keys for a role as 'resource:action' strings
async getRolePermissionKeys(roleId: string): Promise<string[]>
```
