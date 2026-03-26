---
name: NestJS + PostgreSQL — Coding Standards & Patterns
description: >
  Use this skill for every NestJS + PostgreSQL project. Covers project structure, TypeORM patterns,
  authentication, audit logging, response standards, error handling, chart/analytics patterns, and
  all coding conventions. Always read this skill before writing any NestJS code, creating any module,
  or making any architectural decision. Applies to REST APIs, dashboards, admin panels, SaaS backends,
  and any data-driven NestJS application.
---

# NestJS + PostgreSQL — Coding Standards & Patterns

> **MANDATORY**: Read this entire skill before writing any code. Follow every convention exactly. When in doubt, this document is the source of truth.

---

## 1. Project Stack & Libraries

| Layer       | Technology                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| Runtime     | Node.js 20+                                                                  |
| Framework   | NestJS with TypeScript **strict mode** (`"strict": true` in `tsconfig.json`) |
| Database    | PostgreSQL via **TypeORM**                                                   |
| Validation  | `class-validator` + `class-transformer`                                      |
| Auth        | `@nestjs/passport` + `passport-jwt` + `@nestjs/jwt`                          |
| Config      | `@nestjs/config` with Joi validation schema                                  |
| Docs        | `@nestjs/swagger`                                                            |
| Security    | `helmet`                                                                     |
| Compression | `compression`                                                                |
| Logging     | `winston` (via `nest-winston`)                                               |
| Context     | `nestjs-cls` (request-scoped context for audit logging)                      |
| Testing     | Jest (built-in with NestJS)                                                  |

> See [references/dependencies.md](references/dependencies.md) for the full package list with install commands.

### Required `tsconfig.json` Compiler Options

```json
{
  "compilerOptions": {
    "strict": true,
    "strictPropertyInitialization": false,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "target": "ES2021",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"]
    }
  }
}
```

---

## 2. Project Structure

> See [references/project-structure.md](references/project-structure.md) for the full tree with file-level responsibility comments.

```
src/
├── main.ts
├── app.module.ts
├── app.controller.ts           # Health check only
├── common/                     # Shared code used across modules
│   ├── decorators/
│   ├── dto/
│   ├── entities/               # BaseEntity
│   ├── enums/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── types/
│   └── utils/
├── config/                     # app.config.ts, database.config.ts, jwt.config.ts, config.validation.ts
├── database/
│   ├── migrations/
│   └── seeds/
├── modules/
│   ├── auth/                   # Always present
│   ├── users/                  # Always present
│   ├── audit/                  # Always present (global module)
│   ├── <domain-module-1>/      # Project-specific
│   ├── <domain-module-2>/      # Project-specific
│   └── analytics/              # Only if project has charts/reporting
└── types/                      # Global TS declarations (express.d.ts)
```

### Module Rules

- **Every feature module** must contain: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/` (if it has DB tables), `types/`.
- `auth`, `users`, and `audit` are the only modules present in every project. All others are domain-specific.
- Shared code goes in `common/`. Never import from one feature module to another directly — extract shared code first.

---

## 3. Response Types & API Standards

> See [references/types.md](references/types.md) for the complete type definitions.

### Standard API Response Wrapper

Every endpoint must return responses using this shape:

```typescript
// common/types/api-response.type.ts

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Helper Functions for Controllers

Responses should be wrapped in the **Controller** layer using these helper functions:

```typescript
// common/utils/response.util.ts

export function buildResponse<T>(
  data: T,
  meta?: PaginationMeta,
  message = 'Success',
): ApiResponse<T> {
  return { success: true, data, message, meta };
}
```

### Chart Data Response Shape

All chart/analytics endpoints must return data in this format (compatible with Recharts and Chart.js):

```typescript
// common/types/chart.type.ts

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface ChartResponse {
  labels: string[];
  datasets: ChartDataset[];
  summary?: Record<string, number>;
}

export type ChartApiResponse = ApiResponse<ChartResponse>;
```

### HTTP Status Code Usage

| Status                      | When to Use                               |
| --------------------------- | ----------------------------------------- |
| `200 OK`                    | Successful GET, PUT, PATCH                |
| `201 Created`               | Successful POST that creates a resource   |
| `204 No Content`            | Successful DELETE                         |
| `400 Bad Request`           | Malformed requests, bad syntax           |
| `401 Unauthorized`          | Missing/invalid auth token                |
| `403 Forbidden`             | Authenticated but not authorized          |
| `404 Not Found`             | Resource does not exist                   |
| `409 Conflict`              | Business logic validation (parallel)      |
| `422 Unprocessable Entity`  | DTO validation failure (ValidationPipe)   |
| `500 Internal Server Error` | Unexpected server errors                  |

---

## 4. Error Handling

> See [references/bootstrap.md](references/bootstrap.md) for the full filter implementations.

### Custom Exception Classes

```typescript
// common/exceptions/business-validation.exception.ts
export class BusinessValidationException extends ConflictException {
  constructor(public readonly errors: Record<string, string[]>) {
    super({ message: 'Validation failed', errors });
  }
}

// common/exceptions/not-found.exception.ts
export class EntityNotFoundException extends HttpException {
  constructor(entity: string, id: string) {
    super(
      { code: 'NOT_FOUND', message: `${entity} with id ${id} not found` },
      HttpStatus.NOT_FOUND,
    );
  }
}

// common/exceptions/unauthorized.exception.ts
export class UnauthorizedException extends HttpException {
  constructor(message = 'Authentication required') {
    super({ code: 'UNAUTHORIZED', message }, HttpStatus.UNAUTHORIZED);
  }
}
```

---

## 5. DTOs & Validation

### Rules

1. **Every** request body and query parameter set **must** have a DTO class.
2. **Every** DTO field must have `@ApiProperty()` for Swagger docs.
3. Use `@Type(() => Number)` from `class-transformer` for query params that arrive as strings.
4. Use `@ValidateNested()` + `@Type()` for nested objects.

### Shared Base DTOs

```typescript
// common/dto/pagination-query.dto.ts
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

// common/dto/date-range-query.dto.ts
export class DateRangeQueryDto {
  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-31' })
  @IsDateString()
  endDate: string;
}
```

---

## 6. TypeORM Entity Standards

> See [references/typeorm-patterns.md](references/typeorm-patterns.md) for all query patterns, transactions, and error handling.

### BaseEntity — All Entities Must Extend This

```typescript
// common/entities/base.entity.ts
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
```

### Entity Rules

- **Always** extend `BaseEntity`.
- Use `@Index()` on **all** foreign key columns and frequently filtered/sorted columns.
- Column names in the DB must be `snake_case` — use `{ name: 'snake_case_name' }` in `@Column()`.
- Use `@Column({ type: 'decimal', precision: 10, scale: 2 })` for monetary/measurement values.
- **Migrations only** — `synchronize: false` always, even in development.

---

## 7. Service Layer Rules

1. **Business logic lives only in services.** Controllers only handle HTTP concerns.
2. **Never send response wrappers from services.** Services must return raw data (entities, DTOs, or data objects).
3. **Always wrap responses in the controller.** Use `ApiResponse<T>` wrapper (with optional `meta` for pagination) only at the controller level.
4. **Use the repository pattern** — inject repos with `@InjectRepository()`.
5. **Services must not throw raw errors** — use custom exception classes from `common/exceptions/`.
6. **Every mutating method** must write an audit log via `AuditLogService`.

> See [references/audit-log.md](references/audit-log.md) for the complete audit logging pattern.

---

## 8. Naming Conventions

> See [references/conventions.md](references/conventions.md) for the complete reference with examples.

| Element                   | Convention                                   | Example                                       |
| ------------------------- | -------------------------------------------- | --------------------------------------------- |
| Files                     | `kebab-case`                                 | `order-item.entity.ts`, `create-order.dto.ts` |
| Classes                   | `PascalCase`                                 | `OrdersService`, `CreateOrderDto`             |
| Variables / Functions     | `camelCase`                                  | `findAllPaginated`, `orderItem`               |
| DB table and column names | `snake_case`                                 | `order_items`, `created_at`                   |
| Constants                 | `UPPER_SNAKE_CASE`                           | `MAX_PAGE_SIZE`, `BCRYPT_ROUNDS`              |
| Enums                     | `PascalCase` name, `UPPER_SNAKE_CASE` values | `OrderStatus.PENDING`                         |

---

## 9. Common Shared Types

> Full definitions in [references/types.md](references/types.md).

### Core Types — Every Project Must Define These in `common/types/`

- `ApiResponse<T>` — standard consolidated wrapper (optional `meta` for pagination)
- `PaginationMeta` — pagination metadata
- `ApiResponse<T>` — standard consolidated wrapper (optional `meta` for pagination)
- `PaginationMeta` — pagination metadata
- `ChartDataset` — chart dataset shape (if analytics module exists)
- `ChartResponse` — chart endpoint response (if analytics module exists)
- `UserContext` — JWT payload shape attached to requests
- `ErrorDetail` / `ErrorResponse` — error response shapes

> **Domain-specific types** (e.g., types representing your business entities) always live in `modules/<module-name>/types/`, never in `common/types/`.

---

## 10. RBAC Routing Table

Any RBAC work — guards, permissions, roles
→ [references/rbac.md](references/rbac.md)

---

## 11. Configuration

> See [references/environment.md](references/environment.md) for all config files and the Joi validation schema.

### Rules

- **All** config must come from environment variables via `@nestjs/config`.
- **Never** hardcode secrets, connection strings, or ports.
- Validate env vars at startup using a Joi schema — app crashes if validation fails.
- `synchronize: false` always — use migrations.

---

## 12. Swagger / API Docs

> See [references/swagger-standards.md](references/swagger-standards.md) for the complete decorator reference.

### Rules

- Every controller must use `@ApiTags('module-name')`.
- Every endpoint must use `@ApiOperation({ summary: '...' })` and `@ApiResponse()`.
- Protected endpoints must use `@ApiBearerAuth('access-token')`.
- Swagger enabled in non-production only, served at `/api/v1/docs`.

---

## 13. Testing Standards

> See [references/testing-standards.md](references/testing-standards.md) for the full test setup and mocking patterns.

### Rules

- Unit tests for **all** services.
- Test files live beside the file being tested: `orders.service.spec.ts` next to `orders.service.ts`.
- **Mock all external dependencies** (repositories, external services, config).
- No real database in unit tests — ever.

---

## 14. Audit Logging

> See [references/audit-log.md](references/audit-log.md) for the complete implementation.

- Every data mutation (CREATE, UPDATE, DELETE, RESTORE) must produce an audit log entry.
- Uses `nestjs-cls` for request context — services never receive `req`.
- Uses `microdiff` to automatically compute change diffs.
- `AuditLogService` is `@Global()` — injectable everywhere without module imports.
- Audit failure must never break the main request.

---

## 15. Quick Reference Checklist

Before submitting any code, verify:

- [ ] Check for `any` usage — none allowed unless explicitly justified
- [ ] Every endpoint uses the `ApiResponse<T>` wrapper (consolidated)
- [ ] Every DTO has `@ApiProperty()` on all fields
- [ ] Every controller method has `@ApiOperation()` and `@ApiResponse()`
- [ ] Every entity extends `BaseEntity`
- [ ] Foreign keys and frequent query columns have `@Index()`
- [ ] No business logic in controllers
- [ ] Services return typed objects, not raw entities
- [ ] Custom exceptions used instead of throwing generic errors
- [ ] Config values read from `ConfigService`, never hardcoded
- [ ] Every mutating method writes an audit log
- [ ] Unit tests exist for service methods
- [ ] File naming is `kebab-case`
- [ ] Database columns are `snake_case`
- [ ] **Mandatory**: `npm run lint` and `npm run build` pass before every commit (enforced by Husky)
- [ ] **Mandatory**: Run a full quality check (lint + build) at the end of every task/feature implementation

---

## Supporting References

### 🔴 Priority 1 — Read Before Writing Any Code

- [references/bootstrap.md](references/bootstrap.md) — `main.ts` bootstrap, `ResponseTransformInterceptor`, `HttpExceptionFilter`, `AllExceptionFilter`
- [references/auth.md](references/auth.md) — JWT strategy, `JwtAuthGuard`, `RolesGuard`, auth service/controller/DTOs, `@CurrentUser()` decorator
- [references/environment.md](references/environment.md) — `.env.example`, Joi config validation, `database.config.ts`, `ormconfig.ts` for CLI
- [references/logging.md](references/logging.md) — Winston setup (dev colorized / prod JSON), `LoggerModule`, log level rules, sensitive data rules
- [references/dependencies.md](references/dependencies.md) — Canonical package list with install commands

### 🟡 Priority 2 — Read Before Writing Features

- [references/chart-patterns.md](references/chart-patterns.md) — `ChartResponse` type, generic chart templates, date grouping rules, aggregation QueryBuilder patterns
- [references/conventions.md](references/conventions.md) — File/class/variable/DB/API naming rules, DTO rules, TypeScript rules, import order
- [references/new-module-checklist.md](references/new-module-checklist.md) — Step-by-step checklist for creating any new feature module
- [references/project-structure.md](references/project-structure.md) — Exact folder/file structure with one-line responsibility comments, "Where does X go?" rules
- [references/rbac.md](references/rbac.md) — Role and Permission Based Access Control (RBAC) architecture, guards, decorators, and seeder patterns

### 🟢 Priority 3 — Read As Needed

- [references/swagger-standards.md](references/swagger-standards.md) — Swagger decorator requirements, `@ApiProperty()` examples for every field type
- [references/testing-standards.md](references/testing-standards.md) — Test module setup, mocking patterns, required test cases per service method
- [references/typeorm-patterns.md](references/typeorm-patterns.md) — Error handling, transactions, cascade vs. guarded deletes, all query patterns, soft delete, N+1 prevention
- [references/audit-log.md](references/audit-log.md) — `nestjs-cls` setup, audit entity, `AuditLogService`, calling patterns, transaction rules, `sanitizeForAudit()`
- [references/types.md](references/types.md) — Complete type definitions for all shared interfaces
- [references/patterns.md](references/patterns.md) — Additional patterns (AppModule, feature module wiring, migration CLI)

### 📋 Project Setup

---

## 16. Quality Persistence

### Rules

- **Husky Enforcement**: Pre-commit hooks MUST run `npm run lint && npm run build`.
- **Task Conclusion**: Before considering a task "done", the agent MUST execute a final lint and build check.
- **Fail Fast**: Never push code that breaks linting or building. If a fix causes a new lint error, it MUST be resolved immediately.

- [references/new-project-setup.md](references/new-project-setup.md) — Checklist for bootstrapping a new project using this skill
