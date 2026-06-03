import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';
import { IntersectionType } from '@nestjs/swagger';

export class QueryDisaggregationOptionDto extends IntersectionType(
  PaginationQueryDto,
  LocaleQueryDto,
) {
  @ApiPropertyOptional({ example: 'uuid-string' })
  @IsUUID('4')
  @IsOptional()
  disaggregationTypeId?: string;

  @ApiPropertyOptional({
    description: 'Search string to filter disaggregation options by name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
