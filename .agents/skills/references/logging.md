# Logging Setup — Winston Reference

> **Priority 1** — No `console.log` anywhere in the codebase. All logging goes through Winston via the NestJS `Logger` class.

---

## Dependencies

```bash
npm install nest-winston winston
```

---

## File 1 — `src/common/logger/winston.config.ts`

```typescript
import * as winston from 'winston';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

/**
 * Custom format for development — human-readable, colorized.
 * Output: 2025-01-15 10:30:00 | INFO | ItemsService | Creating item | {"userId":"abc"}
 */
const devFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize(),
  printf(({ timestamp, level, message, context, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} | ${level} | ${context ?? 'App'} | ${message}${metaStr}${stackStr}`;
  }),
);

/**
 * JSON format for production — structured logs for log aggregators (Datadog, CloudWatch, ELK).
 * Output: {"timestamp":"2025-01-15T10:30:00.000Z","level":"info","message":"Creating item","context":"ItemsService","userId":"abc"}
 */
const prodFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json(),
);

/**
 * Returns Winston transport configuration based on environment.
 */
export function getWinstonConfig(): winston.LoggerOptions {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || 'info';

  // Silent in test environment — no log noise in test output
  if (nodeEnv === 'test') {
    return {
      silent: true,
      transports: [new winston.transports.Console()],
    };
  }

  return {
    level: logLevel,
    transports: [
      new winston.transports.Console({
        format: nodeEnv === 'production' ? prodFormat : devFormat,
      }),
    ],
  };
}
```

---

## File 2 — `src/common/logger/logger.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { getWinstonConfig } from './winston.config';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot(getWinstonConfig()),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
```

> **`@Global()`**: Registered once in `AppModule`, available everywhere — no need to import per module.

---

## File 3 — Integration in `main.ts`

```typescript
import { WinstonModule } from 'nest-winston';
import { getWinstonConfig } from './common/logger/winston.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Replace NestJS's default logger with Winston
    logger: WinstonModule.createLogger(getWinstonConfig()),
  });
  // ...
}
```

---

## Injection Pattern — How to Use in Services

```typescript
// Replace <ModuleName>Service with your actual service name
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ItemsService {
  // Create a logger scoped to this service — context appears in every log line
  private readonly logger = new Logger(ItemsService.name);

  async create(userId: string, dto: CreateItemDto): Promise<ItemResponseDto> {
    this.logger.log('Creating item', { userId, type: dto.type });

    try {
      const entity = this.itemRepository.create({ ...dto, userId });
      const saved = await this.itemRepository.save(entity);
      this.logger.log('Item created', { id: saved.id, userId });
      return this.toResponseDto(saved);
    } catch (error) {
      this.logger.error('Failed to create item', {
        error: error.message,
        stack: error.stack,
        userId,
      });
      this.handleDbError(error, 'ItemsService.create');
    }
  }
}
```

---

## When to Use Each Log Level

| Level | When | Example |
|---|---|---|
| `error` | Operation failed, needs attention | DB connection lost, unhandled exception, migration failure |
| `warn` | Something unusual but not broken | Duplicate login attempt, deprecated feature usage, slow query |
| `log` / `info` | Normal operations worth recording | User login, record created, migration applied |
| `debug` | Detailed info for debugging | DTO values, query parameters, intermediate computation steps |

---

## Logging Standards — Enforced Rules

### ✅ Always Do

```typescript
// Log with structured metadata
this.logger.log('Record created', { id: saved.id, userId });

// Log errors with full context in every catch block
this.logger.error('Failed to update record', {
  error: error.message,
  stack: error.stack,
  id: recordId,
  userId,
});

// Log warnings for unusual but non-fatal situations
this.logger.warn('Duplicate entry attempt', {
  userId,
  date: dto.date,
});
```

### ❌ Never Do

```typescript
// ❌ Never use console.log / console.error
console.log('something happened');            // BAD
console.error('an error occurred', error);    // BAD

// ❌ Never log without context
this.logger.log('created');                   // BAD — what was created? by whom?

// ❌ Never log sensitive data
this.logger.log('User login', { password: dto.password }); // BAD
this.logger.log('Token generated', { token: accessToken }); // BAD

// ❌ Never swallow errors without logging (except AuditLogService)
catch (error) {
  throw new BusinessLogicException('Something failed');     // BAD — error never logged
}
```

### Catch Block Rule

> Every `catch` block **must** call `this.logger.error()` before rethrowing. The only exception is `AuditLogService.log()` where errors are logged internally but never rethrown.

```typescript
// ✅ Correct pattern for every catch block
catch (error) {
  this.logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { id, userId },
  });
  this.handleDbError(error, 'ServiceName.methodName');
}
```

---

## Log Output Examples

### Development

```
2025-01-15 10:30:00 | info | ItemsService | Creating item | {"userId":"abc-123","type":"STANDARD"}
2025-01-15 10:30:01 | info | ItemsService | Item created | {"id":"def-456","userId":"abc-123"}
2025-01-15 10:30:05 | error | ItemsService | Failed to create item | {"error":"duplicate key value violates unique constraint","userId":"abc-123"}
```

### Production (JSON)

```json
{"timestamp":"2025-01-15T10:30:00.000Z","level":"info","message":"Creating item","context":"ItemsService","userId":"abc-123","type":"STANDARD"}
{"timestamp":"2025-01-15T10:30:01.000Z","level":"info","message":"Item created","context":"ItemsService","id":"def-456","userId":"abc-123"}
{"timestamp":"2025-01-15T10:30:05.000Z","level":"error","message":"Failed to create item","context":"ItemsService","error":"duplicate key value violates unique constraint","stack":"Error: ...","userId":"abc-123"}
```

---

## Sensitive Data — Never Log These

| Field | Reason |
|---|---|
| `password` / `passwordHash` | Authentication secret |
| `accessToken` / `refreshToken` | Session hijacking risk |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token forgery risk |
| `DATABASE_PASSWORD` | DB access |
| Full request body on auth endpoints | Contains passwords |
| Credit card / payment data | PCI compliance |

---

## AppModule Registration

```typescript
@Module({
  imports: [
    LoggerModule, // Global — provides Winston logger everywhere
    // ...
  ],
})
export class AppModule {}
```
