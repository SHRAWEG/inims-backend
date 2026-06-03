import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class CreateDisaggregationTypeDto {
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @IsNotEmpty()
  @ApiProperty({ type: LocalizedFieldDto })
  name: LocalizedFieldDto;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ default: false, required: false })
  isSelective?: boolean;

  @IsInt()
  @IsOptional()
  @ApiProperty({ required: false, example: 1 })
  sortOrder?: number;
}
