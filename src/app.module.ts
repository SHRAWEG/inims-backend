import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { APP_GUARD } from '@nestjs/core';
import { Request } from 'express';
import { validationSchema } from './config/config.validation';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AppController } from './app.controller';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { TypesModule } from './modules/types/types.module';
import { AdministrativeLevelsModule } from './modules/administrative-levels/administrative-levels.module';
import { FrequenciesModule } from './modules/frequencies/frequencies.module';
import { GendersModule } from './modules/genders/genders.module';
import { AgeGroupsModule } from './modules/age-groups/age-groups.module';
import { MsnpIndicatorsModule } from './modules/msnp-indicators/msnp-indicators.module';
import { RolesModule } from './modules/roles/roles.module';

@Module({
  imports: [
    // CLS must be first — request context for audit logging
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: Request) => {
          cls.set('ipAddress', req.ip ?? '');
          cls.set('userAgent', (req.headers['user-agent'] as string) ?? '');
        },
      },
    }),

    // Config — validates env vars on startup
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema,
      validationOptions: { abortEarly: false },
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow('database'),
    }),

    // Common shared module
    CommonModule,

    // Audit Log module (Global)
    AuditLogModule,

    // Auth & Users
    AuthModule,
    UsersModule,
    SectorsModule,
    TypesModule,
    AdministrativeLevelsModule,
    FrequenciesModule,
    GendersModule,
    AgeGroupsModule,
    MsnpIndicatorsModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [
    // Global guards — order matters: JwtAuthGuard runs first
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
