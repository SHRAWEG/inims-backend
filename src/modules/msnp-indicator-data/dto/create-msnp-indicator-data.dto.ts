import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DisaggregationDataInputDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID('4')
  @IsNotEmpty()
  disaggregationOptionId: string;

  @ApiProperty({ example: '50' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateMsnpIndicatorDataDto {
  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the indicator configuration',
  })
  @IsUUID('4')
  @IsNotEmpty()
  indicatorConfigId: string;

  @ApiProperty({ example: 'uuid-string', description: 'ID of the fiscal year' })
  @IsUUID('4')
  @IsNotEmpty()
  fiscalYearId: string;

  @ApiProperty({ example: '100' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'HMIS', required: false })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty({ example: 'Data collected from field', required: false })
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

  // Note: submittedBy will typically be extracted from the authenticated user token in the controller/service
}
