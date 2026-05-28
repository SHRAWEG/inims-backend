import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMsnpIndicatorTargetDto } from './create-msnp-indicator-target.dto';

export class UpdateMsnpIndicatorTargetDto extends PartialType(
  OmitType(CreateMsnpIndicatorTargetDto, [
    'indicatorConfigId',
    'fiscalYearId',
  ] as const),
) {}
