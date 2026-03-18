# Audit Log — Complete Implementation Reference

> Read this before implementing any action that creates, updates, or deletes data.
> All entity names below are generic. Replace `<Entity>`, `<entity-name>` with your actual domain names.

---

## Dependencies

```bash
npm install nestjs-cls microdiff
```

---

## Section 1 — What Must Be Logged

| Action | When |
|---|---|
| `CREATE` | Any new record saved |
| `UPDATE` | Any record modified |
| `SOFT_DELETE` | Record soft-deleted (`deletedAt` set) |
| `DELETE` | Permanent delete (rare — only GDPR purge) |
| `RESTORE` | Soft-deleted record restored |
| `LOGIN` | Successful authentication |
| `LOGIN_FAILED` | Failed authentication attempt |
| `LOGOUT` | User logs out |
| `PASSWORD_CHANGE` | Password updated |

**Never log**: GET requests, health checks, Swagger doc access, read-only analytics queries.

---

## Section 2 — CLS Setup

### Registration in AppModule (MUST be the first import)

```typescript
// app.module.ts
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          // Set initial values — user is NOT available yet during middleware
          cls.set('userId', null);
          cls.set('ipAddress', req.ip);
          cls.set('userAgent', req.headers['user-agent'] ?? null);
        },
      },
    }),
    // ... rest of imports
  ],
})
```

### Fix: Setting userId After Auth

`req.user` is not available during middleware — it's set by `PassportStrategy` which runs later. The fix is to set `userId` in `JwtAuthGuard` after successful authentication:

```typescript
// common/guards/jwt-auth.guard.ts
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

    const result = (await super.canActivate(context)) as boolean;

    // ✅ Now req.user is available — set it in CLS
    const req = context.switchToHttp().getRequest();
    this.cls.set('userId', req.user?.id ?? null);

    return result;
  }
}
```

---

## Section 3 — Audit Log Entity

```typescript
// modules/audit/entities/audit-log.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { AuditAction } from '../../../common/enums/audit-action.enum';

/**
 * Append-only audit log. Does NOT extend BaseEntity:
 * - No updatedAt (logs are never updated)
 * - No deletedAt (logs are never deleted)
 * - No FK on userId (user may be deleted; audit history must persist)
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ name: 'action', type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Index()
  @Column({ name: 'resource', type: 'varchar', length: 100 })
  resource: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ name: 'before_snapshot', type: 'jsonb', nullable: true })
  before: Record<string, any> | null;

  @Column({ name: 'after_snapshot', type: 'jsonb', nullable: true })
  after: Record<string, any> | null;

  @Column({ name: 'diff', type: 'jsonb', nullable: true })
  diff: Record<string, any>[] | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
```

---

## Section 4 — Audit Log Service

```typescript
// modules/audit/audit-log.service.ts

import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { diff } from 'microdiff';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from '../../common/enums/audit-action.enum';

export interface AuditLogInput {
  action: AuditAction;
  resource: string;          // e.g. 'order', 'product', 'user'
  resourceId?: string;
  userId?: string;           // override CLS userId (e.g. for self-registration)
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;
}

const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'hashedRefreshToken',
  'accessToken', 'refreshToken', 'secret', 'token',
];

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly cls: ClsService,
  ) {}

  /**
   * Log an audit event. This method NEVER throws — if audit logging
   * fails, it logs the error and returns silently. Main request must
   * never break because of audit failure.
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      const userId = input.userId ?? this.cls.get('userId') ?? null;
      const ipAddress = this.cls.get('ipAddress') ?? null;
      const userAgent = this.cls.get('userAgent') ?? null;

      // Sanitize snapshots — remove sensitive fields
      const before = input.before ? this.sanitize(input.before) : null;
      const after = input.after ? this.sanitize(input.after) : null;

      // Compute diff for UPDATE actions
      let diffResult: Record<string, any>[] | null = null;
      if (input.action === AuditAction.UPDATE && before && after) {
        diffResult = diff(before, after) as Record<string, any>[];
      }

      const auditLog = this.auditLogRepository.create({
        userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        before,
        after,
        diff: diffResult,
        metadata: input.metadata ?? null,
        ipAddress,
        userAgent,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // ⚠️ NEVER throw — just log the error
      this.logger.error('Failed to write audit log', {
        error: error.message,
        stack: error.stack,
        input: {
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
        },
      });
    }
  }

  /**
   * Strip sensitive fields from the snapshot.
   * Called internally — callers never need to sanitize.
   */
  private sanitize(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
```

---

## Section 5 — Audit Log Module

```typescript
// modules/audit/audit-log.module.ts

@Global()   // Available everywhere — no need to import per module
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
```

---

## Section 6 — How to Call from Services

### CREATE

```typescript
// Replace <entity-name> with your actual resource name (e.g. 'order', 'product')
const saved = await this.<entity>Repository.save(entity);
await this.auditLogService.log({
  action: AuditAction.CREATE,
  resource: '<entity-name>',
  resourceId: saved.id,
  after: saved,
});
```

### UPDATE

```typescript
// Load entity BEFORE updating to capture the before snapshot
const before = await this.<entity>Repository.findOneOrFail({ where: { id } });
Object.assign(before, dto);
const after = await this.<entity>Repository.save(before);
await this.auditLogService.log({
  action: AuditAction.UPDATE,
  resource: '<entity-name>',
  resourceId: id,
  before,
  after,
});
```

### SOFT_DELETE

```typescript
const entity = await this.<entity>Repository.findOneOrFail({ where: { id } });
await this.<entity>Repository.softDelete(id);
await this.auditLogService.log({
  action: AuditAction.SOFT_DELETE,
  resource: '<entity-name>',
  resourceId: id,
  before: entity,
});
```

### RESTORE

```typescript
await this.<entity>Repository.restore(id);
const restored = await this.<entity>Repository.findOne({ where: { id }, withDeleted: true });
await this.auditLogService.log({
  action: AuditAction.RESTORE,
  resource: '<entity-name>',
  resourceId: id,
  after: restored,
});
```

### AUTH Events

```typescript
// Login
await this.auditLogService.log({
  action: AuditAction.LOGIN,
  resource: 'auth',
  resourceId: user.id,
  userId: user.id,
  metadata: { email: user.email },
});

// Login failed
await this.auditLogService.log({
  action: AuditAction.LOGIN_FAILED,
  resource: 'auth',
  metadata: { email: dto.email, reason: 'Invalid password' },
});
```

---

## Section 7 — Transaction Handling

> Audit logs are written **after** `commitTransaction()` — never inside the transaction.

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  const saved = await queryRunner.manager.save(Item, entity);
  await queryRunner.commitTransaction();

  // ✅ Audit AFTER commit
  await this.auditLogService.log({
    action: AuditAction.CREATE,
    resource: 'item',
    resourceId: saved.id,
    after: saved,
  });
} catch (error) {
  await queryRunner.rollbackTransaction();
  // ❌ Do NOT write audit here — the main operation failed
  throw error;
} finally {
  await queryRunner.release();
}
```

**Why after commit?**
- If the transaction rolls back, there's no change to audit
- Audit failure must not cause the main transaction to roll back

---

## Section 8 — Querying Audit Logs (Admin Only)

```typescript
// modules/audit/dto/query-audit-log.dto.ts
export class QueryAuditLogDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resource?: string;
  @ApiPropertyOptional({ enum: AuditAction }) @IsOptional() @IsEnum(AuditAction) action?: AuditAction;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}
```

```typescript
// modules/audit/audit-log.controller.ts
@ApiTags('audit-logs')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Query audit logs (admin only)' })
  async findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }
}
```

```typescript
// In AuditLogService — query method
async findAll(query: QueryAuditLogDto): Promise<PaginatedResponse<AuditLog>> {
  const qb = this.auditLogRepository
    .createQueryBuilder('log')
    .orderBy('log.created_at', 'DESC');

  if (query.userId) qb.andWhere('log.user_id = :userId', { userId: query.userId });
  if (query.resource) qb.andWhere('log.resource = :resource', { resource: query.resource });
  if (query.action) qb.andWhere('log.action = :action', { action: query.action });
  if (query.startDate) qb.andWhere('log.created_at >= :start', { start: query.startDate });
  if (query.endDate) qb.andWhere('log.created_at <= :end', { end: query.endDate });

  qb.skip((query.page - 1) * query.limit).take(query.limit);

  const [data, total] = await qb.getManyAndCount();

  return buildPaginatedResponse(data, buildPaginationMeta(total, query.page, query.limit));
}
```

---

## Section 9 — Migration Checklist

```sql
-- Table: audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                            -- NO foreign key — user may be deleted
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  before_snapshot JSONB,
  after_snapshot JSONB,
  diff JSONB,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs (resource_id);
```

**Rules**:
- No `updated_at` column — audit logs are append-only
- No `deleted_at` column — audit logs are never soft-deleted
- No FK on `user_id` — user account deletion must not cascade to audit history
- No triggers — all audit writes happen explicitly in service code
