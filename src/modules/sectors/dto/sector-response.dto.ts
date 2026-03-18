import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SectorTranslationDto } from './sector-translation.dto';

export class SectorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Resolved name for the requested locale',
  })
  name?: string;

  @ApiPropertyOptional({
    type: [SectorTranslationDto],
    description: 'All translations if withTranslations is true',
  })
  translations?: SectorTranslationDto[];
}
