# Authentication — Full Implementation Reference

> **Priority 1** — Auth must be wired before any protected endpoint can work.
> All examples below are domain-agnostic — copy directly into any NestJS project.

---

## Dependencies

```bash
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

---

## Section 1 — User Entity

```typescript
// src/modules/users/entities/user.entity.ts
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'hashed_refresh_token', type: 'varchar', length: 255, nullable: true })
  hashedRefreshToken: string | null;
}
```

```typescript
// src/common/enums/user-role.enum.ts
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
```

> **Rule**: `passwordHash` and `hashedRefreshToken` are NEVER included in any response DTO. They exist only in the entity.

---

## Section 2 — UserContext & Decorators

### `UserContext` — JWT Payload Shape

```typescript
// src/common/types/user-context.type.ts

/** Decoded JWT payload attached to req.user on every authenticated request */
export interface UserContext {
  id: string;
  email: string;
  role: string;
}
```

### `@CurrentUser()` Decorator

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '../types/user-context.type';

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext): UserContext | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;
    return data ? user?.[data] : user;
  },
);
```

### Usage in Controllers

```typescript
// ✅ Correct — use @CurrentUser() to get the user
@Get('me')
async getProfile(@CurrentUser() user: UserContext) {
  return this.usersService.findById(user.id);
}

// ✅ Also correct — extract a single field
@Get('me')
async getProfile(@CurrentUser('id') userId: string) {
  return this.usersService.findById(userId);
}

// ❌ NEVER do this — don't use @Req() directly
@Get('me')
async getProfile(@Req() req: Request) {
  return this.usersService.findById(req.user.id); // BAD
}
```

### `@Public()` Decorator

```typescript
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### `@Roles()` Decorator

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

---

## Section 3 — JWT Strategy

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserContext } from '../../../common/types/user-context.type';
import { UnauthorizedException } from '../../../common/exceptions/unauthorized.exception';
import { User } from '../../users/entities/user.entity';

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
    // Check if user still exists and is active
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'role', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
```

---

## Section 4 — Guards

### JwtAuthGuard — Applied Globally

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for @Public() decorator — skip auth entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Run passport JWT validation
    const result = (await super.canActivate(context)) as boolean;

    // After successful auth, update CLS context for audit logging
    const req = context.switchToHttp().getRequest();
    this.cls.set('userId', req.user?.id ?? null);

    return result;
  }
}
```

### RolesGuard — Applied Globally After JwtAuthGuard

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → allow through
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### Global Registration in AppModule

```typescript
// In app.module.ts providers array:
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },  // runs first
  { provide: APP_GUARD, useClass: RolesGuard },     // runs second
],
```

---

## Section 5 — Auth DTOs

```typescript
// src/modules/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;
}
```

```typescript
// src/modules/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(1)
  password: string;
}
```

```typescript
// src/modules/auth/dto/refresh-token.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  refreshToken: string;
}
```

```typescript
// src/modules/auth/dto/token-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Access token TTL in seconds' })
  expiresIn: number;
}
```

```typescript
// src/modules/auth/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'USER', enum: ['USER', 'ADMIN'] })
  role: string;

  // ⚠️ passwordHash is NEVER included
  // ⚠️ hashedRefreshToken is NEVER included
}
```

---

## Section 6 — Auth Service

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ──────────── Register ────────────

  async register(dto: RegisterDto): Promise<{ user: UserResponseDto; tokens: TokenResponseDto }> {
    try {
      // Check for existing user
      const existing = await this.userRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) {
        throw new BusinessLogicException('An account with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

      // Create user
      const user = this.userRepository.create({
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      const saved = await this.userRepository.save(user);

      // Generate tokens
      const tokens = await this.generateTokens(saved);

      // Store hashed refresh token
      await this.updateRefreshToken(saved.id, tokens.refreshToken);

      // Audit
      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'user',
        resourceId: saved.id,
        userId: saved.id,
        after: saved,
      });

      return {
        user: this.toUserResponse(saved),
        tokens,
      };
    } catch (error) {
      if (error instanceof BusinessLogicException) throw error;
      this.logger.error('Registration failed', { error: error.message });
      throw error;
    }
  }

  // ──────────── Login ────────────

  async login(dto: LoginDto): Promise<{ user: UserResponseDto; tokens: TokenResponseDto }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      await this.auditLogService.log({
        action: AuditAction.LOGIN_FAILED,
        resource: 'auth',
        metadata: { email: dto.email, reason: 'User not found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.auditLogService.log({
        action: AuditAction.LOGIN_FAILED,
        resource: 'auth',
        userId: user.id,
        metadata: { email: dto.email, reason: 'Account deactivated' },
      });
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.auditLogService.log({
        action: AuditAction.LOGIN_FAILED,
        resource: 'auth',
        userId: user.id,
        metadata: { email: dto.email, reason: 'Invalid password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.auditLogService.log({
      action: AuditAction.LOGIN,
      resource: 'auth',
      resourceId: user.id,
      userId: user.id,
      metadata: { email: user.email },
    });

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  // ──────────── Refresh ────────────

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
      if (!tokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ──────────── Logout ────────────

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { hashedRefreshToken: null });

    await this.auditLogService.log({
      action: AuditAction.LOGOUT,
      resource: 'auth',
      resourceId: userId,
      userId,
    });
  }

  // ──────────── Private helpers ────────────

  private async generateTokens(user: User): Promise<TokenResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    });

    const decoded = this.jwtService.decode(accessToken) as { exp: number; iat: number };

    return {
      accessToken,
      refreshToken,
      expiresIn: decoded.exp - decoded.iat,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userRepository.update(userId, { hashedRefreshToken });
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
```

---

## Section 7 — Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import {
  Controller, Post, Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../common/types/user-context.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account created', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 422, description: 'Email already in use' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout — invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: UserContext) {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }
}
```

---

## Section 8 — Auth Module

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRY', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

---

## Security Rules Summary

| Rule | Implementation |
|---|---|
| Never store plain passwords | `bcrypt.hash(password, 12)` |
| Never return `passwordHash` | `UserResponseDto` explicitly omits it |
| Never return `hashedRefreshToken` | Same — omitted from all response DTOs |
| Refresh tokens stored hashed | `bcrypt.hash(refreshToken, 12)` in DB |
| Deactivated users can't login | `JwtStrategy.validate()` checks `isActive` |
| Public routes explicitly marked | `@Public()` decorator, checked by `JwtAuthGuard` |
| Token expiry from env vars | `JWT_EXPIRY` (default 15m), `JWT_REFRESH_EXPIRY` (default 7d) |
