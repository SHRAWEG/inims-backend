# Bootstrap — `main.ts`, Response Interceptor & Exception Filters

> **Priority 1** — These files must exist before any feature code is written.

---

## File 1 — `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { useContainer } from 'class-validator';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format:
            process.env.NODE_ENV === 'production'
              ? winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                )
              : winston.format.combine(
                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                  winston.format.colorize(),
                  winston.format.printf(
                    ({ timestamp, level, message, context, ...meta }) =>
                      `${timestamp} | ${level} | ${context ?? 'App'} | ${message} | ${
                        Object.keys(meta).length ? JSON.stringify(meta) : ''
                      }`,
                  ),
                ),
        }),
      ],
    }),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ---------- Global prefix ----------
  app.setGlobalPrefix('api/v1');

  // ---------- Global validation pipe ----------
  app.useGlobalPipes(new CustomValidationPipe());

  // ---------- Global filters (order matters: most specific first) ----------
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ValidationExceptionFilter(),
  );

  // Allow class-validator to use NestJS DI
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // ---------- Global interceptors ----------
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(),
    new LoggingInterceptor(),
  );

  // ---------- Security ----------
  app.use(helmet());
  app.use(compression());

  // ---------- CORS ----------
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3001'),
    credentials: true,
  });

  // ---------- Swagger (non-production only) ----------
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('My API') // Replace with your project name
      .setDescription('API documentation') // Replace with your project description
      .setVersion(require('../package.json').version)
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  // ---------- Start ----------
  await app.listen(port);
  const logger = app.get(WinstonModule);
  console.log(`🚀 Server running on port ${port} [${nodeEnv}]`);
  if (nodeEnv !== 'production') {
    console.log(`📚 Swagger docs: http://localhost:${port}/api/v1/docs`);
  }
}

bootstrap();
```

### Registration Order — Why It Matters

| Step | What                                                                      | Why                                                                                                              |
| ---- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | `setGlobalPrefix('api/v1')`                                               | All routes scoped before pipes/filters bind                                                                      |
| 2    | `useGlobalPipes(ValidationPipe)`                                          | Validates incoming data before controllers run                                                                   |
| 3    | `useGlobalFilters(AllExceptionsFilter, ValidationExceptionFilter)`        | NestJS applies filters in reverse order — `ValidationExceptionFilter` runs first, `AllExceptionsFilter` is the fallback |
| 4    | `useGlobalInterceptors(ResponseTransformInterceptor, LoggingInterceptor)` | Response wrapping happens before logging captures the final shape                                                |
| 5    | Helmet + Compression                                                      | Security headers + gzip on all responses                                                                         |
| 6    | CORS                                                                      | Must be before `listen()`                                                                                        |
| 7    | Swagger                                                                   | Served at `/api/v1/docs` — disabled in production                                                                |

---

## File 2 — `src/common/interceptors/response-transform.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../types/api-response.type';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // ──────────────────────────────────────────────
        // Rule 1: Already an ApiResponse — pass through
        // ──────────────────────────────────────────────
        if (response && typeof response === 'object' && 'success' in response) {
          return response;
        }

        // ──────────────────────────────────────────────
        // Rule 2: null / undefined — empty success
        // ──────────────────────────────────────────────
        if (response === null || response === undefined) {
          return {
            success: true,
            data: null,
            message: 'OK',
          };
        }

        // ──────────────────────────────────────────────
        // Rule 3: Paginated shape (has data + meta)
        // ──────────────────────────────────────────────
        if (
          typeof response === 'object' &&
          'data' in response &&
          'meta' in response
        ) {
          return {
            success: true,
            data: response.data,
            meta: response.meta,
            message: 'OK',
          };
        }

        // ──────────────────────────────────────────────
        // Rule 4: Any other response — wrap as data
        // ──────────────────────────────────────────────
        return {
          success: true,
          data: response,
          message: 'OK',
        };
      }),
    );
  }
}
```

### Rules

- The interceptor **never** changes the HTTP status code — that is set by the controller's `@HttpCode()` or defaults.
- The interceptor only affects successful responses. Errors bypass interceptors and go directly to exception filters.
- Controllers can return raw data and the interceptor wraps it, OR controllers can return a pre-built `ApiResponse` and the interceptor passes it through.

---

## File 3 — `src/common/filters/http-exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract details (for validation errors, class-validator returns an object)
    let message: string = exception.message;
    let details: any = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, any>;
      message = resp.message ?? exception.message;
      // class-validator returns { message: string[], error: string, statusCode: number }
      if (Array.isArray(resp.message)) {
        details = resp.message; // validation error array
        message = 'Validation failed';
      } else if (resp.details) {
        details = resp.details;
      }
    }

    this.logger.warn(
      `HTTP ${status} on ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
        ...(details ? { details } : {}),
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## File 4 — `src/common/filters/all-exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';

    // Log the full error regardless of environment
    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `Unhandled non-Error exception on ${request.method} ${request.url}`,
        String(exception),
      );
    }

    const errorResponse: Record<string, any> = {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };

    // In development, include the real message and stack trace for debugging
    if (!isProduction && exception instanceof Error) {
      errorResponse.message = exception.message;
      errorResponse.stack = exception.stack;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: errorResponse,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## Response Shape Summary

### Success (via `ResponseTransformInterceptor`)

```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

### Success — Paginated

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 },
  "message": "OK"
}
```

### Error — Known HTTP Exception (via `HttpExceptionFilter`)

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": ["email must be an email", "password is too short"]
  },
  "path": "/api/v1/auth/register",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error — Unexpected (via `AllExceptionFilter`)

```json
{
  "success": false,
  "error": {
    "code": 500,
    "message": "Internal server error"
  },
  "path": "/api/v1/items",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

In development the 500 response also includes `error.message` (real error) and `error.stack`.
