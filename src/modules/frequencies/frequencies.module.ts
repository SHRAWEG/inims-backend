import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Frequency } from './entities/frequency.entity';
import { FrequencyTranslation } from './entities/frequency-translation.entity';
import { FrequenciesService } from './frequencies.service';
import { FrequenciesController } from './frequencies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Frequency, FrequencyTranslation])],
  controllers: [FrequenciesController],
  providers: [FrequenciesService],
  exports: [FrequenciesService],
})
export class FrequenciesModule {}
