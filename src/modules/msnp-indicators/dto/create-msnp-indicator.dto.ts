import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MsnpIndicatorTranslationDto } from './msnp-indicator-translation.dto';

export class CreateMsnpIndicatorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ type: [MsnpIndicatorTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MsnpIndicatorTranslationDto)
  translations: MsnpIndicatorTranslationDto[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
