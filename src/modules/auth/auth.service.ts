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
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
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

  async register(
    dto: RegisterDto,
  ): Promise<{ user: UserResponseDto; tokens: TokenResponseDto }> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    const saved = await this.userRepository.save(user);

    const tokens = this.generateTokens(saved);
    await this.updateRefreshToken(saved.id, tokens.refreshToken);

    await this.auditLogService.log({
      action: AuditAction.CREATE,
      resource: 'user',
      resourceId: saved.id,
      userId: saved.id,
      after: saved as unknown as Record<string, unknown>,
    });

    return {
      user: this.toUserResponse(saved),
      tokens,
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: UserResponseDto; tokens: TokenResponseDto }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      await this.auditLogService.log({
        action: AuditAction.LOGIN_FAILURE,
        resource: 'auth',
        metadata: { email: dto.email, reason: 'User not found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.auditLogService.log({
        action: AuditAction.LOGIN_FAILURE,
        resource: 'auth',
        userId: user.id,
        metadata: { email: dto.email, reason: 'Account deactivated' },
      });
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.auditLogService.log({
        action: AuditAction.LOGIN_FAILURE,
        resource: 'auth',
        userId: user.id,
        metadata: { email: dto.email, reason: 'Invalid password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.auditLogService.log({
      action: AuditAction.LOGIN_SUCCESS,
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

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: null });

    await this.auditLogService.log({
      action: AuditAction.LOGOUT,
      resource: 'auth',
      resourceId: userId,
      userId,
    });
  }

  private generateTokens(user: User): TokenResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: String(user.role),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string | number>('JWT_EXPIRY', '15m'),
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string | number>(
        'JWT_REFRESH_EXPIRY',
        '7d',
      ),
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decoded: any = this.jwtService.decode(accessToken);

    return {
      accessToken,
      refreshToken,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expiresIn: (decoded.exp as number) - (decoded.iat as number),
    };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userRepository.update(userId, { refreshTokenHash });
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
