import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FrequencyTranslationDto } from './frequency-translation.dto';

export class FrequencyResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ type: [FrequencyTranslationDto] })
  translations?: FrequencyTranslationDto[];

  @ApiProperty()
  isActive: boolean;
}
