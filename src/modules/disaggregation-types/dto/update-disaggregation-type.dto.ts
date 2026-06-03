import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateDisaggregationTypeDto } from './create-disaggregation-type.dto';
import { ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialLocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class UpdateDisaggregationTypeDto extends PartialType(
  OmitType(CreateDisaggregationTypeDto, ['name'] as const),
) {
  @ValidateNested()
  @Type(() => PartialLocalizedFieldDto)
  @IsOptional()
  @ApiProperty({ type: PartialLocalizedFieldDto, required: false })
  name?: PartialLocalizedFieldDto;
}
