import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FrequencyTranslationDto } from './frequency-translation.dto';

export class CreateFrequencyDto {
  @ApiProperty({ type: [FrequencyTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrequencyTranslationDto)
  translations: FrequencyTranslationDto[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
