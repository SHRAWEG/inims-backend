import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgeGroup } from './entities/age-group.entity';
import { AgeGroupTranslation } from './entities/age-group-translation.entity';
import { AgeGroupsService } from './age-groups.service';
import { AgeGroupsController } from './age-groups.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgeGroup, AgeGroupTranslation]),
    AuditLogModule,
  ],
  controllers: [AgeGroupsController],
  providers: [AgeGroupsService],
  exports: [AgeGroupsService],
})
export class AgeGroupsModule {}
