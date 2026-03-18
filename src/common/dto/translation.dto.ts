import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SupportedLocale } from '../types/i18n.type';

export class TranslationDto {
  @ApiProperty({ enum: ['en', 'ne'] })
  @IsEnum(['en', 'ne'])
  @IsNotEmpty()
  locale: SupportedLocale;
}
