import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateDisaggregationOptionDto } from './create-disaggregation-option.dto';
import { ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialLocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class UpdateDisaggregationOptionDto extends PartialType(
  OmitType(CreateDisaggregationOptionDto, ['name'] as const),
) {
  @ValidateNested()
  @Type(() => PartialLocalizedFieldDto)
  @IsOptional()
  @ApiProperty({ type: PartialLocalizedFieldDto, required: false })
  name?: PartialLocalizedFieldDto;
}
