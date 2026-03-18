import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// src/common/dto/localized-field.dto.ts
export class LocalizedFieldDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'English value' })
  en: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'नेपाली मान' })
  ne: string;
}

export class PartialLocalizedFieldDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({ example: 'English value', required: false })
  en?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({ example: 'नेपाली मान', required: false })
  ne?: string;
}
