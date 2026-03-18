import {
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdministrativeLevelTranslationDto } from './administrative-level-translation.dto';

export class CreateAdministrativeLevelDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ type: [AdministrativeLevelTranslationDto] })
  @ValidateNested({ each: true })
  @Type(() => AdministrativeLevelTranslationDto)
  @ArrayMinSize(1)
  translations: AdministrativeLevelTranslationDto[];
}
