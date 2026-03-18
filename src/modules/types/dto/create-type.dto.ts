import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class CreateTypeDto {
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @ApiProperty({
    type: LocalizedFieldDto,
    example: { en: 'Urban', ne: 'शहरी' },
  })
  name: LocalizedFieldDto;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ default: true })
  isActive: boolean = true;
}
