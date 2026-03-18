import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../types/i18n.type';

export class LocaleQueryDto {
  @ApiPropertyOptional({ enum: ['en', 'ne'], default: 'en' })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale: string = DEFAULT_LOCALE;
}
