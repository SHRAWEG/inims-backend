import { ApiProperty } from '@nestjs/swagger';

export class DisaggregationDataResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  disaggregationOptionId: string;

  @ApiProperty()
  disaggregationOptionName: string;

  @ApiProperty({ example: '50' })
  value: string;
}

export class MsnpIndicatorDataResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  indicatorConfigId: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  indicatorId?: string;

  @ApiProperty({ example: 'uuid-string' })
  fiscalYearId: string;

  @ApiProperty({ example: '100' })
  value: string;

  @ApiProperty({ example: 'HMIS', required: false })
  dataSource: string | null;

  @ApiProperty({ example: 'Data collected from field', required: false })
  remarks: string | null;

  @ApiProperty({ example: 'uuid-string' })
  submittedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [DisaggregationDataResponseDto], required: false })
  disaggregations?: DisaggregationDataResponseDto[];
}
