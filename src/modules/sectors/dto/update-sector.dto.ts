import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PartialLocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class UpdateSectorDto {
  @ValidateNested()
  @Type(() => PartialLocalizedFieldDto)
  @IsOptional()
  @ApiProperty({ type: PartialLocalizedFieldDto, required: false })
  name?: PartialLocalizedFieldDto;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  isActive?: boolean;
}
