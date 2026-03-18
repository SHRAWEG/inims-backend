import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class SectorTranslationDto extends TranslationDto {
  @ApiProperty({ example: 'Health' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
