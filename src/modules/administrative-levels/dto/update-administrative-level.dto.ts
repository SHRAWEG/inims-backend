import { PartialType } from '@nestjs/swagger';
import { CreateAdministrativeLevelDto } from './create-administrative-level.dto';

export class UpdateAdministrativeLevelDto extends PartialType(
  CreateAdministrativeLevelDto,
) {}
