import { ApiProperty } from '@nestjs/swagger';

export class DisaggregationOptionFormDto {
  @ApiProperty()
  disaggregationOptionId: string;

  @ApiProperty()
  disaggregationOptionName: string;

  @ApiProperty({ nullable: true, type: 'string' })
  value: string | null;
}

export class DisaggregationTypeFormDto {
  @ApiProperty()
  disaggregationTypeId: string;

  @ApiProperty()
  disaggregationTypeName: string;

  @ApiProperty({ type: [DisaggregationOptionFormDto] })
  options: DisaggregationOptionFormDto[];
}

export class DataEntryFormResponseDto {
  @ApiProperty()
  indicatorConfigId: string;

  @ApiProperty()
  indicatorId: string;

  @ApiProperty()
  indicatorCode: string;

  @ApiProperty()
  indicatorName: string;

  @ApiProperty({ nullable: true, type: 'string' })
  unit: string | null;

  @ApiProperty({ nullable: true, type: 'string' })
  value: string | null;

  @ApiProperty({ nullable: true, type: 'string' })
  dataSource: string | null;

  @ApiProperty({ nullable: true, type: 'string' })
  remarks: string | null;

  @ApiProperty({ type: [DisaggregationTypeFormDto] })
  disaggregations: DisaggregationTypeFormDto[];
}
