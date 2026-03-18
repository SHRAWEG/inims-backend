import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrativeLevel as AdministrativeLevelEntity } from './entities/administrative-level.entity';
import { AdministrativeLevelsService } from './administrative-levels.service';
import { AdministrativeLevelsController } from './administrative-levels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdministrativeLevelEntity])],
  controllers: [AdministrativeLevelsController],
  providers: [AdministrativeLevelsService],
  exports: [AdministrativeLevelsService],
})
export class AdministrativeLevelsModule {}
