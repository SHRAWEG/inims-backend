import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { SupportedLocale } from '../../../common/types/i18n.type';

export class MsnpIndicatorTranslationDto {
  @ApiProperty({ enum: ['en', 'ne'] })
  @IsEnum(['en', 'ne'])
  locale: SupportedLocale;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
