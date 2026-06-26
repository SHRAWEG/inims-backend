import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';
import { IsInt, Min } from 'class-validator';

export class CreateChildContentDto {
  @ApiProperty({ type: LocalizedFieldDto })
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  title: LocalizedFieldDto;

  @ApiProperty({ example: 'section-1' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ type: LocalizedFieldDto })
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  htmlContent: LocalizedFieldDto;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  parent?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
