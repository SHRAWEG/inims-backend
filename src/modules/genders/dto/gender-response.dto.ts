import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderTranslationDto } from './gender-translation.dto';

export class GenderResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ type: [GenderTranslationDto] })
  translations?: GenderTranslationDto[];

  @ApiProperty()
  isActive: boolean;
}
