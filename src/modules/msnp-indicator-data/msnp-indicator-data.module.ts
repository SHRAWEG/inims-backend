import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsnpIndicatorDataController } from './msnp-indicator-data.controller';
import { MsnpIndicatorDataService } from './msnp-indicator-data.service';
import { MsnpIndicatorData } from './entities/msnp-indicator-data.entity';
import { MsnpIndicatorDisaggregationData } from './entities/msnp-indicator-disaggregation-data.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MsnpIndicatorData,
      MsnpIndicatorDisaggregationData,
    ]),
    AuditLogModule,
    UsersModule,
  ],
  controllers: [MsnpIndicatorDataController],
  providers: [MsnpIndicatorDataService],
})
export class MsnpIndicatorDataModule {}
