import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgeGroup } from './entities/age-group.entity';
import { AgeGroupsService } from './age-groups.service';
import { AgeGroupsController } from './age-groups.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AgeGroup])],
  controllers: [AgeGroupsController],
  providers: [AgeGroupsService],
  exports: [AgeGroupsService],
})
export class AgeGroupsModule {}
