import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsnpIndicator } from './entities/msnp-indicator.entity';
import { MsnpIndicatorTranslation } from './entities/msnp-indicator-translation.entity';
import { MsnpIndicatorsService } from './msnp-indicators.service';
import { MsnpIndicatorsController } from './msnp-indicators.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MsnpIndicator, MsnpIndicatorTranslation]),
  ],
  controllers: [MsnpIndicatorsController],
  providers: [MsnpIndicatorsService],
  exports: [MsnpIndicatorsService],
})
export class MsnpIndicatorsModule {}
