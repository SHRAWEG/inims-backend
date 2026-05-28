import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryFiscalYearDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by fiscal year name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Transform(({ value }): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
