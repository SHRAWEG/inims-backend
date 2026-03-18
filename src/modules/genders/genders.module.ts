import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gender } from './entities/gender.entity';
import { GendersService } from './genders.service';
import { GendersController } from './genders.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gender]), AuditLogModule],
  controllers: [GendersController],
  providers: [GendersService],
  exports: [GendersService],
})
export class GendersModule {}
