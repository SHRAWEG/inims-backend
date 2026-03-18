import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdministrativeLevelTranslationDto } from './administrative-level-translation.dto';

export class AdministrativeLevelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Resolved name for the requested locale',
  })
  name?: string;

  @ApiPropertyOptional({
    type: [AdministrativeLevelTranslationDto],
    description: 'All translations if withTranslations is true',
  })
  translations?: AdministrativeLevelTranslationDto[];
}
