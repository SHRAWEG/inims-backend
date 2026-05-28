import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

export class QueryMsnpIndicatorTargetDto extends IntersectionType(
  PaginationQueryDto,
  LocaleQueryDto,
) {
  @ApiPropertyOptional({ description: 'Search by remarks' })
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
