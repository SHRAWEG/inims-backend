import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { LocaleQueryDto } from './locale-query.dto';

export class FindOneQueryDto extends LocaleQueryDto {
  @ApiPropertyOptional({
    description: 'Include all translations in the response',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  withTranslations?: boolean;
}
