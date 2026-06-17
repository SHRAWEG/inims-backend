import {
  IsString,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

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

  @ApiProperty({ type: LocalizedFieldDto })
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  htmlContent: LocalizedFieldDto;
}
