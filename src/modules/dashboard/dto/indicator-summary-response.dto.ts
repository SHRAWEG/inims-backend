import { ApiProperty } from '@nestjs/swagger';

export class DashboardIndicatorTargetDto {
  @ApiProperty()
  fiscalYear: string;

  @ApiProperty()
  targetValue: string;
}

export class DashboardIndicatorDto {
  @ApiProperty()
  indicatorConfigId: string;

  @ApiProperty()
  indicatorCode: string;

  @ApiProperty()
  indicatorName: string;

  @ApiProperty()
  sector: string;

  @ApiProperty({ type: String, nullable: true })
  currentStatus: string | null;

  @ApiProperty({ type: [DashboardIndicatorTargetDto] })
  targets: DashboardIndicatorTargetDto[];
}

export class IndicatorSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: Record<string, string>;

  @ApiProperty()
  description: Record<string, string>;

  @ApiProperty()
  category: string;

  @ApiProperty({ type: [DashboardIndicatorDto] })
  indicators: DashboardIndicatorDto[];
}
