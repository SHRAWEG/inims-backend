import {
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeTranslationDto } from './type-translation.dto';

export class CreateTypeDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ type: [TypeTranslationDto] })
  @ValidateNested({ each: true })
  @Type(() => TypeTranslationDto)
  @ArrayMinSize(1)
  translations: TypeTranslationDto[];
}
