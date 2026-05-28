import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMsnpIndicatorTargetDto {
  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the indicator configuration',
  })
  @IsUUID('4')
  @IsNotEmpty()
  indicatorConfigId: string;

  @ApiProperty({ example: 'uuid-string', description: 'ID of the fiscal year' })
  @IsUUID('4')
  @IsNotEmpty()
  fiscalYearId: string;

  @ApiProperty({ example: '150' })
  @IsString()
  @IsNotEmpty()
  targetValue: string;

  @ApiProperty({ example: 'Target to achieve by end of year', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
