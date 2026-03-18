import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '../../../common/dto/translation.dto';

export class AdministrativeLevelTranslationDto extends TranslationDto {
  @ApiProperty({ example: 'Province' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
