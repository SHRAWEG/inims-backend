import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMsnpIndicatorDataDto {
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

  @ApiProperty({ example: '100' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'HMIS', required: false })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty({ example: 'Data collected from field', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  // Note: submittedBy will typically be extracted from the authenticated user token in the controller/service
}
