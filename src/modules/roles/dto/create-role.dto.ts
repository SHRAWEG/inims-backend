import {
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedFieldDto } from '../../../common/dto/localized-field.dto';

export class CreateRoleDto {
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  @ApiProperty({
    type: LocalizedFieldDto,
    example: { en: 'Program Manager', ne: 'कार्यक्रम प्रबन्धक' },
  })
  name: LocalizedFieldDto;

  @ApiProperty({ example: 'Manages indicators and users' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: ['uuid-1', 'uuid-2'], description: 'Permission IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}
