import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  LocalizedFieldDto,
  RequiredLocalizedFieldDto,
} from '../../../common/dto/localized-field.dto';
import { IsInt, Min } from 'class-validator';

export class CreateContentDto {
  @ApiProperty({ type: LocalizedFieldDto })
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  title: LocalizedFieldDto;

  @ApiProperty({ example: 'about-us' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ type: RequiredLocalizedFieldDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequiredLocalizedFieldDto)
  htmlContent?: RequiredLocalizedFieldDto;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
