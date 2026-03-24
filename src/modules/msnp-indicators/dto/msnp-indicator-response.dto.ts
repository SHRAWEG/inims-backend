import { ApiProperty } from '@nestjs/swagger';
import {
  LocalizedField,
  SupportedLocale,
} from '../../../common/types/i18n.type';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class MsnpIndicatorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ enum: ['en', 'ne'] })
  locale: SupportedLocale;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MsnpIndicatorDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ type: LocalizedFieldDto })
  name: LocalizedField;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
