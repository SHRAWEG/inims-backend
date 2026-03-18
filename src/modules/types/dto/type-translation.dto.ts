import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class TypeTranslationDto extends TranslationDto {
  @ApiProperty({ example: 'Nutrition' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
