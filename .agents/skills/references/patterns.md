# Additional Patterns & Reference Implementations

> Supplementary patterns referenced by the main SKILL.md. Copy and adapt as needed.
> Replace `<Entity>`, `<module-name>`, etc. with your actual domain names.

---

## 1. Auth Module — JWT Strategy Setup

> See [auth.md](auth.md) for the complete auth implementation.

### Passport JWT Strategy

```typescript
// modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<UserContext> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'role', 'isActive'],
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or deactivated account');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
```

---

## 2. Custom Decorators

### @CurrentUser

```typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;
    return data ? user?.[data] : user;
  },
);
```

### @Public

```typescript
// common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### @Roles

```typescript
// common/decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

---

## 3. Response Transform Interceptor

> See [bootstrap.md](bootstrap.md) for the full implementation.

---

## 4. Logging Interceptor

```typescript
// common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log(`${method} ${url} ${response.statusCode} — ${Date.now() - now}ms`);
      }),
    );
  }
}
```

---

## 5. AppModule Pattern

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { validationSchema } from './config/config.validation';

import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerModule } from './common/logger/logger.module';

// Feature modules — replace with your actual domain modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditLogModule } from './modules/audit/audit-log.module';
// import { <DomainModule> } from './modules/<domain>/<domain>.module';

@Module({
  imports: [
    // CLS — MUST be first
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set('userId', req.user?.id ?? null);
          cls.set('ipAddress', req.ip);
          cls.set('userAgent', req.headers['user-agent'] ?? null);
        },
      },
    }),

    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema,
      validationOptions: { abortEarly: false },
    }),

    // Logger
    LoggerModule,

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<boolean>('database.logging'),
      }),
    }),

    // Always-present modules
    AuthModule,
    UsersModule,
    AuditLogModule,

    // Domain modules — add your project-specific modules here
    // <DomainModule>,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalHttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

---

## 6. Feature Module Pattern

```typescript
// modules/<module-name>/<module-name>.module.ts
// Replace <Entity> with your actual entity name

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { <ModuleName>Controller } from './<module-name>.controller';
import { <ModuleName>Service } from './<module-name>.service';
import { <Entity> } from './entities/<entity>.entity';

@Module({
  imports: [TypeOrmModule.forFeature([<Entity>])],
  controllers: [<ModuleName>Controller],
  providers: [<ModuleName>Service],
  exports: [<ModuleName>Service],
})
export class <ModuleName>Module {}
```

---

## 7. Analytics / Chart Endpoint Pattern

> Only relevant if the project has an analytics/reporting module. See [chart-patterns.md](chart-patterns.md) for detailed patterns.

```typescript
// modules/analytics/analytics.service.ts
// Replace with your actual entity and metric names

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(<Entity>)
    private readonly repository: Repository<<Entity>>,
  ) {}

  async getMetricTrend(userId: string, query: DateRangeQueryDto): Promise<ChartResponse> {
    const results = await this.repository
      .createQueryBuilder('item')
      .select("DATE_TRUNC('day', item.created_at)::date", 'date')
      .addSelect('SUM(item.value)', 'total')
      .where('item.user_id = :userId', { userId })
      .andWhere('item.created_at BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      })
      .andWhere('item.deleted_at IS NULL')
      .groupBy("DATE_TRUNC('day', item.created_at)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      labels: results.map((r) => r.date.toISOString().slice(0, 10)),
      datasets: [{ label: 'Total', data: results.map((r) => parseFloat(r.total) || 0) }],
    };
  }
}
```

---

## 8. Migration Commands

```bash
# Generate a new migration from entity changes
npx typeorm migration:generate src/database/migrations/MigrationName -d ormconfig.ts

# Run pending migrations
npx typeorm migration:run -d ormconfig.ts

# Revert the last migration
npx typeorm migration:revert -d ormconfig.ts
```

---

## 9. Response Utility — Full Implementation

```typescript
// common/utils/pagination.util.ts

export function buildResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { success: true, data, message };
}

export function buildPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message = 'Success',
): PaginatedResponse<T> {
  return { success: true, data, message, meta };
}

export function buildNullResponse(message = 'No content'): ApiResponse<null> {
  return { success: true, data: null, message };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
```
