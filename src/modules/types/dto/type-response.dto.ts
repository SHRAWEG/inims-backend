import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeTranslationDto } from './type-translation.dto';

export class TypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Resolved name for the requested locale',
  })
  name?: string;

  @ApiPropertyOptional({
    type: [TypeTranslationDto],
    description: 'All translations if withTranslations is true',
  })
  translations?: TypeTranslationDto[];
}
