import { ApiProperty } from '@nestjs/swagger';

export class MsnpIndicatorDataResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  indicatorConfigId: string;

  @ApiProperty({ example: 'uuid-string' })
  fiscalYearId: string;

  @ApiProperty({ example: '100' })
  value: string;

  @ApiProperty({ example: 'HMIS', required: false })
  dataSource: string | null;

  @ApiProperty({ example: 'Data collected from field', required: false })
  remarks: string | null;

  @ApiProperty({ example: 'uuid-string' })
  submittedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
