import {
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SectorTranslationDto } from './sector-translation.dto';

export class CreateSectorDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ type: [SectorTranslationDto] })
  @ValidateNested({ each: true })
  @Type(() => SectorTranslationDto)
  @ArrayMinSize(1)
  translations: SectorTranslationDto[];
}
