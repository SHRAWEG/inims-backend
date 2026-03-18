import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class CreateMsnpIndicatorDto {
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @ApiProperty({
    type: LocalizedFieldDto,
    example: { en: 'MI-1', ne: 'एमआई-१' },
  })
  code: LocalizedFieldDto;

  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @ApiProperty({
    type: LocalizedFieldDto,
    example: { en: 'Stunting Rate', ne: 'पुड्कोपन दर' },
  })
  name: LocalizedFieldDto;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ default: true })
  isActive: boolean = true;
}
