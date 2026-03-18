import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class CreateFrequencyDto {
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @ApiProperty({
    type: LocalizedFieldDto,
    example: { en: 'Monthly', ne: 'मासिक' },
  })
  name: LocalizedFieldDto;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ default: true })
  isActive: boolean = true;
}
