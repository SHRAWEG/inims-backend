import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgeGroupTranslationDto } from './age-group-translation.dto';

export class AgeGroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ type: [AgeGroupTranslationDto] })
  translations?: AgeGroupTranslationDto[];

  @ApiProperty()
  isActive: boolean;
}
