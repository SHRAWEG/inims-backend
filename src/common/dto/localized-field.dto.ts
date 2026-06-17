import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class LocalizedFieldDto {
  @ApiPropertyOptional({ example: 'About Us' })
  @IsOptional()
  @IsString()
  en?: string;

  @ApiProperty({ example: 'हाम्रो बारे' })
  @IsString()
  @IsNotEmpty()
  ne: string;
}

export class PartialLocalizedFieldDto extends PartialType(LocalizedFieldDto) {}
