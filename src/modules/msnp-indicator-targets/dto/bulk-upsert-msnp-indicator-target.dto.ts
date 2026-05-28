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

export class MsnpIndicatorTargetEntryDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID('4')
  @IsNotEmpty()
  indicatorConfigId: string;

  @ApiProperty({ example: '150' })
  @IsString()
  @IsNotEmpty()
  targetValue: string;

  @ApiProperty({ example: 'Target to achieve', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkUpsertMsnpIndicatorTargetDto {
  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the fiscal year for this bulk target',
  })
  @IsUUID('4')
  @IsNotEmpty()
  fiscalYearId: string;

  @ApiProperty({ type: [MsnpIndicatorTargetEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MsnpIndicatorTargetEntryDto)
  entries: MsnpIndicatorTargetEntryDto[];
}
