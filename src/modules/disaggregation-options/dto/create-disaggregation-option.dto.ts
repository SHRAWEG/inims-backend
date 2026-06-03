import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class CreateDisaggregationOptionDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({ example: 'uuid-string' })
  disaggregationTypeId: string;

  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @IsNotEmpty()
  @ApiProperty({ type: LocalizedFieldDto })
  name: LocalizedFieldDto;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiProperty({ required: false, example: '0_5_YRS' })
  code?: string;

  @IsInt()
  @IsOptional()
  @ApiProperty({ required: false, example: 1 })
  sortOrder?: number;
}
