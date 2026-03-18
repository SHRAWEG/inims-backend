import { PartialType } from '@nestjs/swagger';
import { CreateMsnpIndicatorDto } from './create-msnp-indicator.dto';

export class UpdateMsnpIndicatorDto extends PartialType(
  CreateMsnpIndicatorDto,
) {}
