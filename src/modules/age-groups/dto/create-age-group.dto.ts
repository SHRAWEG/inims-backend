import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgeGroupTranslationDto } from './age-group-translation.dto';

export class CreateAgeGroupDto {
  @ApiProperty({ type: [AgeGroupTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgeGroupTranslationDto)
  translations: AgeGroupTranslationDto[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
