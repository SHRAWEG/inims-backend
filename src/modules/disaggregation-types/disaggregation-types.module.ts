import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisaggregationTypesService } from './disaggregation-types.service';
import { DisaggregationTypesController } from './disaggregation-types.controller';
import { DisaggregationType } from './entities/disaggregation-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DisaggregationType])],
  controllers: [DisaggregationTypesController],
  providers: [DisaggregationTypesService],
  exports: [DisaggregationTypesService],
})
export class DisaggregationTypesModule {}
