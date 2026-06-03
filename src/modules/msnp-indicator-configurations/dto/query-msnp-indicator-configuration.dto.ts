import { IntersectionType, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';
import { IsOptional, IsUUID, IsString } from 'class-validator';

export class QueryMsnpIndicatorConfigurationDto extends IntersectionType(
  PaginationQueryDto,
  LocaleQueryDto,
) {
  @ApiPropertyOptional({ description: 'Filter by indicator ID' })
  @IsUUID('4')
  @IsOptional()
  indicatorId?: string;

  @ApiPropertyOptional({ description: 'Filter by role ID' })
  @IsUUID('4')
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Search by indicator name' })
  @IsString()
  @IsOptional()
  search?: string;
}
