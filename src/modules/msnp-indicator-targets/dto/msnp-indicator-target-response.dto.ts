import { ApiProperty } from '@nestjs/swagger';

export class MsnpIndicatorTargetResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  indicatorConfigId: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  indicatorId?: string;

  @ApiProperty({ required: false })
  indicatorCode?: string;

  @ApiProperty({ example: 'Indicator 1 Name', required: false })
  indicatorName?: string;

  @ApiProperty({ example: 'Percentage', required: false })
  unit?: string;

  @ApiProperty({ example: 'uuid-string' })
  fiscalYearId: string;

  @ApiProperty({ example: '150' })
  targetValue: string;

  @ApiProperty({ example: 'Target to achieve', required: false })
  remarks: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
