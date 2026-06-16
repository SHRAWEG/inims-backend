import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Type } from '../types/entities/type.entity';
import { MsnpIndicatorConfiguration } from '../msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Type, MsnpIndicatorConfiguration])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
