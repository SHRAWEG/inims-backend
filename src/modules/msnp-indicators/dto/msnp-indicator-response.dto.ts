import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MsnpIndicatorTranslationDto } from './msnp-indicator-translation.dto';

export class MsnpIndicatorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ type: [MsnpIndicatorTranslationDto] })
  translations?: MsnpIndicatorTranslationDto[];

  @ApiProperty()
  isActive: boolean;
}
