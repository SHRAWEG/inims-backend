import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SupportedLocale } from '../types/i18n.type';

export class LocaleQueryDto {
  @IsOptional()
  @IsEnum(['en', 'ne'], { message: 'Locale must be en or ne' })
  @ApiProperty({ enum: ['en', 'ne'], default: 'en', required: false })
  locale: SupportedLocale = 'en';
}
