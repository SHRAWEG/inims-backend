import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GenderTranslationDto } from './gender-translation.dto';

export class CreateGenderDto {
  @ApiProperty({ type: [GenderTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenderTranslationDto)
  translations: GenderTranslationDto[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
