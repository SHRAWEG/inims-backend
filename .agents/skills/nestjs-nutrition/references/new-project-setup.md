# New Project Setup Checklist

> Follow this checklist when bootstrapping a brand new NestJS + PostgreSQL project using this skill.
> This bridges the generic skill to a specific project.

---

## Step 1 — Define Your Domain

- [ ] List all domain modules this project needs (e.g., `products`, `orders`, `invoices`)
- [ ] For each module, name the primary entity (e.g., `Product`, `Order`, `Invoice`)
- [ ] Identify which modules have parent-child relations (need cascade rules)
- [ ] Identify if project needs an analytics module (charts/reporting)
- [ ] Document all of the above in a project-specific README

---

## Step 2 — Scaffold the Project

```bash
# Create NestJS project
npx -y @nestjs/cli new <project-name> --package-manager npm --skip-git
cd <project-name>
```

- [ ] Project scaffolded successfully
- [ ] Delete default `app.controller.spec.ts`, `app.service.ts` (replaced by our patterns)

---

## Step 3 — Install Dependencies

Follow [dependencies.md](dependencies.md) for the full package list.

```bash
# Core
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/typeorm typeorm pg class-validator class-transformer nestjs-cls bcrypt helmet compression

# Logging
npm install winston nest-winston

# Swagger
npm install @nestjs/swagger swagger-ui-express

# Validation
npm install joi

# Utilities
npm install microdiff

# Dev
npm install -D @types/passport-jwt @types/bcrypt @types/compression
```

- [ ] All core dependencies installed
- [ ] Dev dependencies (including `husky`) installed
- [ ] Initialize Husky: `npx husky init`
- [ ] Configure pre-commit hook: `echo "npm run lint && npm run build" > .husky/pre-commit`

---

## Step 4 — Configure Environment

- [ ] Copy `.env.example` from [environment.md](environment.md) to `.env`
- [ ] Fill in `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- [ ] Generate `JWT_SECRET` (min 32 chars): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Generate `JWT_REFRESH_SECRET` (min 32 chars — must be different from JWT_SECRET)
- [ ] Set `NODE_ENV=development`
- [ ] Add `.env` to `.gitignore` — NEVER commit it

---

## Step 5 — Set Up Project Structure

Create the folder structure from [project-structure.md](project-structure.md):

- [ ] Create `src/config/` — copy `app.config.ts`, `database.config.ts`, `jwt.config.ts`, `config.validation.ts` from [environment.md](environment.md)
- [ ] Create `src/common/` — all subfolders: `decorators/`, `dto/`, `entities/`, `enums/`, `exceptions/`, `filters/`, `guards/`, `interceptors/`, `pipes/`, `types/`, `utils/`
- [ ] Copy `BaseEntity` from SKILL.md into `common/entities/base.entity.ts`
- [ ] Copy all exception classes from SKILL.md into `common/exceptions/`
- [ ] Copy all shared DTOs from [types.md](types.md) into `common/dto/`
- [ ] Copy all shared types from [types.md](types.md) into `common/types/`
- [ ] Copy all enums from [types.md](types.md) into `common/enums/`
- [ ] Copy decorators from [auth.md](auth.md) into `common/decorators/`
- [ ] Copy guards from [auth.md](auth.md) into `common/guards/`
- [ ] Copy filters from [bootstrap.md](bootstrap.md) into `common/filters/`
- [ ] Copy interceptors from [bootstrap.md](bootstrap.md) into `common/interceptors/`
- [ ] Create `src/database/migrations/` and `src/database/seeds/`
- [ ] Create `src/modules/`
- [ ] Create `src/types/express.d.ts`
- [ ] Create `ormconfig.ts` at project root (from [environment.md](environment.md))

---

## Step 6 — Set Up `main.ts`

- [ ] Copy `main.ts` from [bootstrap.md](bootstrap.md)
- [ ] Update Swagger title and description for your project
- [ ] Verify CORS origin matches your frontend URL

---

## Step 7 — Set Up `AppModule`

- [ ] Copy `AppModule` pattern from [patterns.md](patterns.md)
- [ ] Ensure `ClsModule.forRoot()` is the **first** import
- [ ] Ensure `ConfigModule.forRoot()` uses the validation schema
- [ ] Ensure `APP_GUARD` providers are registered (JwtAuthGuard, RolesGuard)
- [ ] Verify app starts: `npm run start:dev`

---

## Step 8 — Set Up Winston Logger

- [ ] Copy logging config from [logging.md](logging.md)
- [ ] Create `LoggerModule` (global)
- [ ] Register in `AppModule`
- [ ] Verify colored log output in dev

---

## Step 9 — Set Up Database

- [ ] Create PostgreSQL database matching `DATABASE_NAME`
- [ ] Verify TypeORM connects on startup (check logs for "TypeOrmModule connected")
- [ ] Verify `synchronize: false` — no auto-schema changes

---

## Step 10 — Implement Auth Module

Follow [auth.md](auth.md) step by step:

- [ ] Create `src/modules/users/` with `User` entity
- [ ] Create `src/modules/auth/` with JWT strategy, service, controller, DTOs
- [ ] Generate migration for `users` table: `npm run migration:generate -- src/database/migrations/CreateUsersTable`
- [ ] Review and run migration: `npm run migration:run`
- [ ] Test `POST /api/v1/auth/register` via Swagger
- [ ] Test `POST /api/v1/auth/login` via Swagger
- [ ] Verify JWT guard blocks unauthenticated requests

---

## Step 11 — Implement Audit Module

Follow [audit-log.md](audit-log.md):

- [ ] Create `src/modules/audit/` with `AuditLog` entity, service, controller
- [ ] Mark `AuditLogModule` as `@Global()`
- [ ] Generate and run migration for `audit_logs` table
- [ ] Verify audit logs are created on auth events

---

## Step 12 — Create Domain Modules

For each domain module identified in Step 1, follow [new-module-checklist.md](new-module-checklist.md):

- [ ] Module 1: `_____________` — entity defined, migration run, CRUD endpoints working
- [ ] Module 2: `_____________` — entity defined, migration run, CRUD endpoints working
- [ ] Module 3: `_____________` — entity defined, migration run, CRUD endpoints working

---

## Step 13 — Analytics Module (If Needed)

Follow [chart-patterns.md](chart-patterns.md):

- [ ] Define project-specific chart shapes in `references/chart-patterns.local.md`
- [ ] Implement analytics module
- [ ] Verify `ChartResponse` matches frontend expectations

---

## Step 14 — Pre-Commit Verification

- [ ] `npm run build` — zero errors
- [ ] `npm run test` — all tests pass
- [ ] All endpoints documented in Swagger at `/api/v1/docs`
- [ ] `.env` is in `.gitignore` — not committed
- [ ] `.env.example` is committed and up to date
- [ ] No hardcoded secrets, URLs, or magic numbers
- [ ] All service methods have try/catch with `handleDbError()`
- [ ] All mutating endpoints write audit logs
- [ ] No `console.log` anywhere — all logging via Winston
