import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalYearsController } from './fiscal-years.controller';
import { FiscalYearsService } from './fiscal-years.service';
import { FiscalYear } from './entities/fiscal-year.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FiscalYear]),
    AuditLogModule,
    UsersModule,
  ],
  controllers: [FiscalYearsController],
  providers: [FiscalYearsService],
})
export class FiscalYearsModule {}
