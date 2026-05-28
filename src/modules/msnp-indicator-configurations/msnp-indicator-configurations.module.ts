import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsnpIndicatorConfigurationsController } from './msnp-indicator-configurations.controller';
import { MsnpIndicatorConfigurationsService } from './msnp-indicator-configurations.service';
import { MsnpIndicatorConfiguration } from './entities/msnp-indicator-configuration.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MsnpIndicatorConfiguration]),
    AuditLogModule,
    UsersModule,
  ],
  controllers: [MsnpIndicatorConfigurationsController],
  providers: [MsnpIndicatorConfigurationsService],
})
export class MsnpIndicatorConfigurationsModule {}
