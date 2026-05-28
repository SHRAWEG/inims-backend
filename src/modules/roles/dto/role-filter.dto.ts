import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

export class RoleFilterDto extends LocaleQueryDto {
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
