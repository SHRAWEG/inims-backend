import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';
import { IntersectionType } from '@nestjs/swagger';

export class QueryDisaggregationTypeDto extends IntersectionType(
  PaginationQueryDto,
  LocaleQueryDto,
) {
  @ApiPropertyOptional({
    description: 'Search string to filter disaggregation types by name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
