import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IntersectionType } from '@nestjs/swagger';

export class RoleFilterDto extends IntersectionType(
  LocaleQueryDto,
  PaginationQueryDto,
) {
  @ApiPropertyOptional({ description: 'Search term for role name' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
