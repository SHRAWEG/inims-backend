import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DisaggregationConfigInputDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID('4')
  @IsNotEmpty()
  disaggregationTypeId: string;

  @ApiProperty({ example: ['uuid-string'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  optionIds?: string[];
}

export class CreateMsnpIndicatorConfigurationDto {
  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the MSNP Indicator',
  })
  @IsUUID('4')
  @IsNotEmpty()
  indicatorId: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  @IsUUID('4')
  @IsOptional()
  sectorId?: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  @IsUUID('4')
  @IsOptional()
  typeId?: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  @IsUUID('4')
  @IsOptional()
  roleId?: string;

  @ApiProperty({ required: false, example: 'percentage' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: [DisaggregationConfigInputDto],
    required: false,
    description: 'List of disaggregations to apply to this configuration',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisaggregationConfigInputDto)
  disaggregations?: DisaggregationConfigInputDto[];
}
