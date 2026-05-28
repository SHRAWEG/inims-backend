import { PartialType } from '@nestjs/swagger';
import { CreateMsnpIndicatorConfigurationDto } from './create-msnp-indicator-configuration.dto';

export class UpdateMsnpIndicatorConfigurationDto extends PartialType(
  CreateMsnpIndicatorConfigurationDto,
) {}
