import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisaggregationOptionsService } from './disaggregation-options.service';
import { DisaggregationOptionsController } from './disaggregation-options.controller';
import { DisaggregationOption } from './entities/disaggregation-option.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DisaggregationOption])],
  controllers: [DisaggregationOptionsController],
  providers: [DisaggregationOptionsService],
  exports: [DisaggregationOptionsService],
})
export class DisaggregationOptionsModule {}
