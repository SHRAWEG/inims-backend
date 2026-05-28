import { IsUUID, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMsnpIndicatorConfigurationDto {
  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the MSNP Indicator',
  })
  @IsUUID('4')
  @IsNotEmpty()
  indicatorId: string;

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

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
