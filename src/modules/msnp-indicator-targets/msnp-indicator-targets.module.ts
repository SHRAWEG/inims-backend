import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsnpIndicatorTargetsController } from './msnp-indicator-targets.controller';
import { MsnpIndicatorTargetsService } from './msnp-indicator-targets.service';
import { MsnpIndicatorTarget } from './entities/msnp-indicator-target.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MsnpIndicatorTarget]),
    AuditLogModule,
    UsersModule,
  ],
  controllers: [MsnpIndicatorTargetsController],
  providers: [MsnpIndicatorTargetsService],
})
export class MsnpIndicatorTargetsModule {}
