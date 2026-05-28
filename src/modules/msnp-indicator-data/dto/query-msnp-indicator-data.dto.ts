import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryMsnpIndicatorDataDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by remarks or data source' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by indicator config ID' })
  @IsUUID('4')
  @IsOptional()
  indicatorConfigId?: string;

  @ApiPropertyOptional({ description: 'Filter by fiscal year ID' })
  @IsUUID('4')
  @IsOptional()
  fiscalYearId?: string;
}
