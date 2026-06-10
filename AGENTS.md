# INIMS Backend — Agent Guide

## Commands

| Action | Command |
|--------|---------|
| Dev server | `npm run start:dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Migrations (run) | `npm run migration:run` |
| Migrations (generate) | `npm run migration:generate src/database/migrations/<Name>` |
| Seed | `npm run seed` |
| Tests | `npm run test` |
| E2E tests | `npm run test:e2e` |

Pre-commit (husky): `npm run lint && npm run build`. Always run both before committing.

## Key Architecture

- **NestJS 11** + TypeORM + PostgreSQL. Entrypoint: `src/main.ts` (sets global prefix `/api/v1`, Swagger at `/api/v1/docs`).
- **Path aliases** (from `tsconfig.json`): `@common/*` → `src/common/*`, `@config/*` → `src/config/*`, `@modules/*` → `src/modules/*`.
- **Global guards** (order matters): `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`. Use `@Public()` decorator to bypass auth.
- **Response wrapper**: Every endpoint returns `{ success, data, message, meta? }` via `ResponseTransformInterceptor`.
- **Config**: `@nestjs/config` with Joi validation. Env vars required at startup. Config files in `src/config/` (`app`, `database`, `jwt`).
- **DB**: `synchronize: false` always — migrations only. `ormconfig.ts` is CLI-only; app uses `database.config.ts`.
- **Audit logging**: Every mutation writes audit log via `AuditLogService` (global, uses `nestjs-cls` for request context).
- **CLS must be first import** in `AppModule` — request context for audit/IP/user-agent.

## Module Structure

Each feature module under `src/modules/` has: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`.

Core modules: `auth`, `users`, `audit-log` (always present). Domain modules: `sectors`, `types`, `msnp-indicators`, `msnp-indicator-configurations`, `msnp-indicator-targets`, `msnp-indicator-data`, `disaggregation-types`, `disaggregation-options`, `frequencies`, `genders`, `age-groups`, `administrative-levels`, `fiscal-years`, `roles`.

## DB & TypeORM Conventions

- All entities extend `BaseEntity` (uuid PK, timestamptz `created_at`/`updated_at`/`deleted_at`).
- Column names are `snake_case` in DB.
- Composite unique indexes on `resource`+`action` (permissions), `indicator_config_id`+`fiscal_year_id` (targets/data).
- Use `@Index()` on FK columns and frequently filtered columns.
- Seeds in `src/database/seeders/`: `permissions.seeder.ts` + `superadmin.seeder.ts` (runs via `npm run seed`).
- Migration files in `src/database/migrations/`.

## Seed Credentials

```
Email: admin@inims.com.np
Password: Admin123
```
The seeder console log incorrectly prints `superadmin123` — the actual hashed password is `Admin123`.

## Enums & Decorators

- `SystemRole`: `SUPER_ADMIN`, `ADMIN`
- `AuditAction`: `CREATE`, `UPDATE`, `DELETE`, `SOFT_DELETE`, `RESTORE`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_CHANGE`
- Guards: `@Public()`, `@Roles()`, `@Permissions()`, `@CurrentUser()`

## Libraries

bcrypt (passwords), class-validator + class-transformer (DTOs), passport-jwt (auth), nest-winston + winston (logging), microdiff (audit diffs), joi (env validation), compression, helmet, @nestjs/swagger.

## References

Detailed coding standards and patterns are in `.agents/skills/`:

- `.agents/skills/SKILL.md` — mandatory reading before any code work. Covers stack, structure, response types, error handling, DTO rules, entity standards, service layer, naming, RBAC, Swagger, testing, audit logging.
- `.agents/skills/references/auth.md` — JWT strategy, guards, auth service/DTOs, `@CurrentUser()`.
- `.agents/skills/references/bootstrap.md` — main.ts setup, interceptors, filters, pipes.
- `.agents/skills/references/environment.md` — env config, Joi validation schema, ormconfig vs database.config.
- `.agents/skills/references/logging.md` — Winston setup (dev colorized / prod JSON).
- `.agents/skills/references/typeorm-patterns.md` — queries, transactions, soft deletes, N+1 prevention.
- `.agents/skills/references/audit-log.md` — audit service, microdiff diffs, nestjs-cls context.
- `.agents/skills/references/rbac.md` — roles, permissions, guards flow.
- `.agents/skills/references/conventions.md` — naming, file structure, import order.
- `.agents/skills/references/swagger-standards.md` — decorator requirements per endpoint.
- `.agents/skills/references/testing-standards.md` — test module setup, mocking patterns.
- `.agents/skills/references/new-module-checklist.md` — step-by-step for creating feature modules.
- `.agents/skills/references/types.md` — API response types, chart types, shared interfaces.
- `.agents/skills/references/chart-patterns.md` — chart response shape, date grouping, aggregation.
- `.agents/skills/references/dependencies.md` — full package list with install commands.
- `.agents/skills/references/project-structure.md` — full file tree with responsibility comments.
- `.agents/skills/references/patterns.md` — AppModule wiring, feature module patterns.
- `.agents/skills/references/new-project-setup.md` — project bootstrap checklist.
