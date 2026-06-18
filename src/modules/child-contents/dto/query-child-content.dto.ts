import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryChildContentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by title or slug' })
  @IsString()
  @IsOptional()
  search?: string;
}
