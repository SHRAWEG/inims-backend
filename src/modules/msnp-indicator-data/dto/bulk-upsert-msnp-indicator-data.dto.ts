import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DisaggregationDataInputDto } from './create-msnp-indicator-data.dto';

export class MsnpIndicatorDataEntryDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID('4')
  @IsNotEmpty()
  indicatorConfigId: string;

  @ApiProperty({ example: '100' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'HMIS', required: false })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty({ example: 'Notes', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    type: [DisaggregationDataInputDto],
    required: false,
    description: 'Values for specific disaggregation options',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisaggregationDataInputDto)
  disaggregations?: DisaggregationDataInputDto[];
}

export class BulkUpsertMsnpIndicatorDataDto {
  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the fiscal year for this bulk data',
  })
  @IsUUID('4')
  @IsNotEmpty()
  fiscalYearId: string;

  @ApiProperty({ type: [MsnpIndicatorDataEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MsnpIndicatorDataEntryDto)
  entries: MsnpIndicatorDataEntryDto[];
}
