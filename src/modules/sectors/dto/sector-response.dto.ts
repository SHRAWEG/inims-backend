import { ApiProperty } from '@nestjs/swagger';
import {
  LocalizedField,
  SupportedLocale,
} from '../../../common/types/i18n.type';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class SectorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string; // resolved single string for the requested locale

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ enum: ['en', 'ne'] })
  locale: SupportedLocale;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SectorDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: LocalizedFieldDto })
  name: LocalizedField; // full object: { en: '...', ne: '...' }

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
