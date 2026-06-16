import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryIndicatorSummaryDto {
  @ApiPropertyOptional({
    description: 'Filter by category (All, Impact, Outcome, Output)',
  })
  @IsString()
  @IsOptional()
  filter?: string;

  @ApiPropertyOptional({ description: 'Fiscal Year ID for Current Status' })
  @IsUUID()
  @IsOptional()
  fiscalYearId?: string;
}
