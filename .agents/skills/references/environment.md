# Environment & Configuration Reference

> **Priority 1** — Config must be validated before the app boots. Missing env vars = crash on startup, not a silent runtime error.

---

## File 1 — `.env.example`

> Always keep this file updated when adding new environment variables. This is the single source of truth for what the app needs to run.

```dotenv
# ═══════════════════════════════════════
# App
# ═══════════════════════════════════════
PORT=3000                           # Server port
NODE_ENV=development                # development | staging | production
CORS_ORIGIN=http://localhost:3001   # Allowed CORS origin (frontend URL)
API_PREFIX=api/v1                   # Global route prefix

# ═══════════════════════════════════════
# Database (PostgreSQL)
# ═══════════════════════════════════════
DATABASE_HOST=localhost             # DB host
DATABASE_PORT=5432                  # DB port
DATABASE_NAME=my_app_db             # DB name — replace with your project database name
DATABASE_USER=postgres              # DB username
DATABASE_PASSWORD=                  # DB password — REQUIRED, no default
DATABASE_SSL=false                  # Enable SSL for DB connection (true in production)

# ═══════════════════════════════════════
# JWT Authentication
# ═══════════════════════════════════════
JWT_SECRET=                         # REQUIRED — min 32 chars, used to sign access tokens
JWT_EXPIRY=15m                      # Access token TTL (e.g. 15m, 1h)
JWT_REFRESH_SECRET=                 # REQUIRED — min 32 chars, used to sign refresh tokens
JWT_REFRESH_EXPIRY=7d               # Refresh token TTL (e.g. 7d, 30d)

# ═══════════════════════════════════════
# Logging
# ═══════════════════════════════════════
LOG_LEVEL=debug                     # error | warn | info | debug — controls min log level
```

---

## File 2 — `src/config/config.validation.ts`

```typescript
import * as Joi from 'joi';

/**
 * Joi schema that validates ALL environment variables on app startup.
 * If any required variable is missing or has the wrong type, NestJS throws
 * and the app refuses to start — fail fast, not at runtime.
 *
 * Usage in AppModule:
 *   ConfigModule.forRoot({ validationSchema })
 */
export const validationSchema = Joi.object({
  // ── App ──
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  CORS_ORIGIN: Joi.string().uri().default('http://localhost:3001'),
  API_PREFIX: Joi.string().default('api/v1'),

  // ── Database ──
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required().allow(''),
  DATABASE_SSL: Joi.boolean().default(false),

  // ── JWT ──
  JWT_SECRET: Joi.string().min(32).required()
    .messages({ 'string.min': 'JWT_SECRET must be at least 32 characters for security' }),
  JWT_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required()
    .messages({ 'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters for security' }),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // ── Logging ──
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
});
```

### How It Works

- On app startup, `ConfigModule.forRoot({ validationSchema })` runs this Joi schema against `process.env`.
- If **any** required variable is missing → the app throws and prints a clear error message.
- Default values are applied for optional variables.
- This prevents the common bug of deploying to production with a missing `JWT_SECRET` and discovering it only when the first login attempt fails.

---

## File 3 — `src/config/database.config.ts`

```typescript
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  // Entity loading
  autoLoadEntities: true,         // Auto-discovers entities registered via TypeOrmModule.forFeature()

  // ⚠️ CRITICAL: synchronize is ALWAYS false
  // Never true — not even in development. Use migrations.
  synchronize: false,

  // Migrations run manually via CLI — never auto-run on boot
  migrationsRun: false,

  // SQL query logging — development only
  logging: process.env.NODE_ENV === 'development',

  // SSL — required for most cloud databases in production
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,

  // Migration paths (used by CLI via ormconfig.ts)
  migrations: ['dist/database/migrations/*.js'],
}));
```

### Key Rules

| Setting | Value | Why |
|---|---|---|
| `synchronize` | `false` always | Auto-sync drops/recreates columns without warning. One wrong entity change = data loss. |
| `migrationsRun` | `false` | Migrations run explicitly via CLI so you review before applying. |
| `logging` | `true` only in dev | SQL logs in production are noisy and may leak sensitive data. |
| `autoLoadEntities` | `true` | Automatically registers entities from `TypeOrmModule.forFeature()` calls — no manual entity array. |

---

## File 4 — `ormconfig.ts` (Project Root — CLI Only)

```typescript
// ormconfig.ts — used ONLY by TypeORM CLI for migration commands
// This file is NOT loaded by the NestJS app. The app uses database.config.ts.

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  logging: true,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
```

### Migration CLI Commands

```bash
# Generate a migration from entity changes (compares entities to DB schema)
npx typeorm migration:generate src/database/migrations/MigrationName -d ormconfig.ts

# Run all pending migrations
npx typeorm migration:run -d ormconfig.ts

# Revert the last migration
npx typeorm migration:revert -d ormconfig.ts

# Show migration status
npx typeorm migration:show -d ormconfig.ts
```

Add these as npm scripts in `package.json`:

```json
{
  "scripts": {
    "migration:generate": "typeorm migration:generate -d ormconfig.ts",
    "migration:run": "typeorm migration:run -d ormconfig.ts",
    "migration:revert": "typeorm migration:revert -d ormconfig.ts",
    "migration:show": "typeorm migration:show -d ormconfig.ts"
  }
}
```

---

## File 5 — `src/config/app.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
}));
```

---

## File 6 — `src/config/jwt.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiry: process.env.JWT_EXPIRY || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));
```

---

## AppModule — Config Registration

```typescript
// In app.module.ts:
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/config.validation';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,              // Available everywhere — no need to import per module
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema,            // Joi schema — crashes on startup if env vars are invalid
      validationOptions: {
        abortEarly: false,         // Report ALL validation errors, not just the first one
      },
    }),
    // ...
  ],
})
export class AppModule {}
```

---

## Rules

- **Never hardcode** any value that varies between environments — always use env vars.
- **Never commit** `.env` — only `.env.example` is committed.
- **Always validate** — if a new env var is added, add it to both `.env.example` and `config.validation.ts`.
- **`synchronize: false`** — always. No exceptions. Not even for "quick testing."
- **Config access** — always via `ConfigService.get()`, never `process.env` directly in service code.
