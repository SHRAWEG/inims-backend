import { IsUUID, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MsnpIndicatorConfigurationInputDto {
  @ApiProperty({ example: 'uuid-string', required: false })
  @IsUUID('4')
  @IsOptional()
  sectorId?: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  @IsUUID('4')
  @IsOptional()
  typeId?: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  @IsUUID('4')
  @IsOptional()
  roleId?: string;

  @ApiProperty({ required: false, example: 'percentage' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
