# Project Structure — NestJS + PostgreSQL

> **Rule**: All file names use `kebab-case`. All folder names use `kebab-case`. No exceptions.

---

## Root Directory

```
project-root/
├── .env.example                # Template for required environment variables — keep updated with every new env var
├── ormconfig.ts                # TypeORM DataSource for migration CLI (typeorm migration:generate/run/revert)
├── tsconfig.json               # TypeScript config — strict mode enabled, path aliases for @common, @config, @modules
├── package.json
├── nest-cli.json
├── test/                       # E2E test files (*.e2e-spec.ts)
└── src/
```

---

## `src/` — Application Source

```
src/
├── main.ts                     # Bootstrap: NestFactory, global pipes/filters/interceptors, Swagger, helmet, compression, winston
├── app.module.ts               # Root module: imports ConfigModule, TypeOrmModule, all feature modules, global providers
├── app.controller.ts           # Health-check endpoint ONLY (GET /health) — no business logic
├── config/
├── database/
├── common/
├── modules/
└── types/                      # Global TS declaration files (e.g., express.d.ts to augment Request)
```

---

## `src/config/` — Configuration

```
config/
├── app.config.ts               # Registers 'app' namespace: port, environment, apiPrefix
├── database.config.ts          # Registers 'database' namespace: host, port, username, password, database, synchronize, logging
├── jwt.config.ts               # Registers 'jwt' namespace: secret, expiresIn, refreshExpiresIn
└── config.validation.ts        # Joi schema validating all required env vars at startup — app crashes if validation fails
```

---

## `src/database/` — Database Infrastructure

```
database/
├── database.module.ts          # Configures TypeOrmModule.forRootAsync with injected ConfigService
├── migrations/                 # Auto-generated migration files — NEVER hand-written
│   └── *.ts                    # Each file: one migration class with up() and down() methods
└── seeds/                      # Seed scripts for development/staging data
    └── *.seed.ts               # Each file: a runnable script that inserts baseline data
```

---

## `src/common/` — Shared Infrastructure Layer

> **What belongs here**: Code used by 2 or more modules.
> **What does NOT belong here**: Feature-specific business logic, feature-specific DTOs or types used by only one module.

```
common/
├── common.module.ts            # Exports shared providers for global registration
│
├── decorators/
│   ├── current-user.decorator.ts   # @CurrentUser() — extracts UserContext from request.user
│   ├── public.decorator.ts         # @Public() — marks endpoint as exempt from JWT guard
│   └── roles.decorator.ts          # @Roles(...roles) — attaches required roles metadata for RolesGuard
│
├── dto/
│   ├── pagination-query.dto.ts     # PaginationQueryDto — page, limit
│   ├── date-range-query.dto.ts     # DateRangeQueryDto — startDate, endDate, granularity
│   ├── id-param.dto.ts             # IdParamDto — validates :id route param as UUID
│   └── localized-field.dto.ts      # LocalizedFieldDto for JSONB bilingual fields
│
├── entities/
│   └── base.entity.ts              # Abstract BaseEntity: id (UUID PK), createdAt, updatedAt, deletedAt (soft delete)
│
├── enums/
│   ├── audit-action.enum.ts        # AuditAction: CREATE, UPDATE, SOFT_DELETE, DELETE, RESTORE, LOGIN, etc.
│   └── user-role.enum.ts           # UserRole: USER, ADMIN
│
├── exceptions/
│   ├── validation.exception.ts     # ValidationException (400)
│   ├── not-found.exception.ts      # EntityNotFoundException (404)
│   ├── business-logic.exception.ts # BusinessLogicException (422)
│   └── unauthorized.exception.ts   # UnauthorizedException (401)
│
├── filters/
│   ├── http-exception.filter.ts    # Catches HttpException subclasses → standard error response shape
│   └── all-exception.filter.ts     # Catches all unhandled exceptions → generic 500 in production
│
├── guards/
│   ├── jwt-auth.guard.ts           # Extends AuthGuard('jwt'), respects @Public(), sets CLS userId
│   └── roles.guard.ts              # Checks @Roles() metadata against request.user.role
│
├── interceptors/
│   ├── response-transform.interceptor.ts  # Wraps all successful responses in ApiResponse<T> shape
│   └── logging.interceptor.ts             # Logs HTTP method, URL, status code, and response time
│
├── pipes/
│   ├── parse-uuid.pipe.ts          # Validates and transforms string params to UUID format
│   └── validation.pipe.ts          # Custom ValidationPipe config
│
├── types/
│   ├── api-response.type.ts        # ApiResponse<T>, PaginatedResponse<T>, PaginationMeta
│   ├── chart.type.ts               # ChartDataset, ChartResponse, ChartApiResponse (if analytics module exists)
│   ├── error.type.ts               # ErrorDetail, ErrorResponse
│   ├── i18n.type.ts                # LocalizedField, SupportedLocale — used by every entity with bilingual fields
│   └── user-context.type.ts        # UserContext (JWT payload shape), UserRole enum
│
└── utils/
    ├── date.util.ts                # Date formatting, range generation, ISO helpers
    ├── chart.util.ts               # Helpers to build ChartDataset[] from raw query results (if analytics)
    ├── pagination.util.ts          # buildResponse(), buildPaginatedResponse(), buildPaginationMeta()
    └── audit.util.ts               # sanitizeForAudit() — strips sensitive fields
```

---

## `src/modules/` — Feature Modules

> **Rule**: One folder per domain. Every module follows the exact same internal structure.
>
> `auth`, `users`, and `audit` are present in **every** project. All other modules are domain-specific and defined at project start.

### Always-Present Modules

```
modules/
├── auth/                       # Authentication — JWT login, register, refresh, logout
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   ├── strategies/             # Passport JWT strategy
│   └── types/
│
├── users/                      # User management
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   ├── entities/
│   └── types/
│
└── audit/                      # Audit logging (@Global module)
    ├── audit-log.module.ts
    ├── audit-log.controller.ts # Admin-only query endpoint
    ├── audit-log.service.ts
    ├── dto/
    └── entities/
```

### Domain-Specific Modules (Examples)

```
modules/
├── <domain-1>/                 # Replace with your domain — e.g. orders/, products/, invoices/
│   ├── <domain-1>.module.ts
│   ├── <domain-1>.controller.ts
│   ├── <domain-1>.service.ts
│   ├── dto/
│   │   ├── create-<entity>.dto.ts
│   │   ├── update-<entity>.dto.ts
│   │   └── query-<entity>.dto.ts
│   ├── entities/
│   │   └── <entity>.entity.ts
│   └── types/
│       └── <entity>-entry.type.ts
│
├── <domain-2>/                 # Another domain module — same internal structure
│   └── ...
│
└── analytics/                  # OPTIONAL — only if project has charts/reporting
    ├── analytics.module.ts     # Imports entities from other modules for read-only querying
    ├── analytics.controller.ts # GET endpoints returning ChartApiResponse
    ├── analytics.service.ts    # Aggregation queries, chart data assembly
    ├── dto/
    └── types/
```

### Internal Structure Template (every module)

```
<module-name>/
├── <module-name>.module.ts       # NestJS module: imports, controllers, providers, exports
├── <module-name>.controller.ts   # HTTP layer ONLY: parse request, call service, return response
├── <module-name>.service.ts      # ALL business logic lives here
├── dto/
│   ├── create-<entity>.dto.ts    # DTO for POST/create operations
│   ├── update-<entity>.dto.ts    # DTO for PATCH/PUT operations (often PartialType of create DTO)
│   └── query-<entity>.dto.ts     # DTO for GET query parameters
├── entities/                     # TypeORM entity classes (only if module owns DB tables)
│   └── <entity>.entity.ts
└── types/                        # Types/interfaces used ONLY within this module
    └── <entity>-entry.type.ts
```

---

## Where Does X Go?

| Scenario | Location | Rationale |
|---|---|---|
| **Business logic** | `modules/*/service` only | Controllers handle HTTP concerns only |
| **Shared types** used in 2+ modules | `common/types/*.type.ts` | Single source of truth; prevents circular imports |
| **Types used in only 1 module** | `modules/<module>/types/` | Keeps module self-contained |
| **Chart/analytics query logic** | `modules/analytics/analytics.service.ts` | Centralized aggregation |
| **Raw TypeORM entities** | **Never returned** from services to controllers | Always map to a typed response object |
| **New database migrations** | `database/migrations/` via CLI only | Never hand-write migration files |
| **Shared DTOs** (pagination, date range) | `common/dto/` | Base classes extended by module-specific query DTOs |
| **Module-specific DTOs** | `modules/<module>/dto/` | Stay inside the module that owns the endpoint |
| **Environment config** | `config/*.config.ts` | One file per concern |
| **Custom decorators** | `common/decorators/` | Shared across all controllers |
| **Exception classes** | `common/exceptions/` | Consistent error handling everywhere |
| **Pure utility functions** | `common/utils/` | No DI, no side effects |
| **Passport strategies** | `modules/auth/strategies/` | Auth module owns all authentication strategies |
| **Base entity** | `common/entities/base.entity.ts` | Extended by all entities in all modules |
| **Seed data** | `database/seeds/` | Development/staging bootstrap data |

---

## File Naming Quick Reference

| Type | Pattern | Example |
|---|---|---|
| Module | `<module-name>.module.ts` | `orders.module.ts` |
| Controller | `<module-name>.controller.ts` | `orders.controller.ts` |
| Service | `<module-name>.service.ts` | `orders.service.ts` |
| Entity | `<entity-name>.entity.ts` | `order.entity.ts` |
| DTO | `action-<entity>.dto.ts` | `create-order.dto.ts` |
| Type | `description.type.ts` | `order-summary.type.ts` |
| Guard | `guard-name.guard.ts` | `jwt-auth.guard.ts` |
| Test | `file-being-tested.spec.ts` | `orders.service.spec.ts` |
| Migration | Auto-generated by CLI | `1710000000000-CreateOrdersTable.ts` |
