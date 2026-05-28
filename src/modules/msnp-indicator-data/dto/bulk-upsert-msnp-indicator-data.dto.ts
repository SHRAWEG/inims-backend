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
