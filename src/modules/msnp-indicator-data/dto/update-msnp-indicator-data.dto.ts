import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMsnpIndicatorDataDto } from './create-msnp-indicator-data.dto';

// Typically, you wouldn't update the config ID or fiscal year ID after creation
export class UpdateMsnpIndicatorDataDto extends PartialType(
  OmitType(CreateMsnpIndicatorDataDto, [
    'indicatorConfigId',
    'fiscalYearId',
  ] as const),
) {}
