import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class CreateGenderDto {
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @ApiProperty({
    type: LocalizedFieldDto,
    example: { en: 'Male', ne: 'पुरुष' },
  })
  name: LocalizedFieldDto;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ default: true })
  isActive: boolean = true;
}
