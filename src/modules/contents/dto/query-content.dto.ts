import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

export class QueryContentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by title or slug' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Locale for localized fields (en or ne)',
  })
  @IsOptional()
  locale?: LocaleQueryDto['locale'];
}
