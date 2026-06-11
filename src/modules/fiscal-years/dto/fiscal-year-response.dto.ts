import { ApiProperty } from '@nestjs/swagger';

export class FiscalYearResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: '2081/82' })
  year: string;

  @ApiProperty({ example: '2024/25', required: false })
  dateInAd: string | null;

  @ApiProperty({ example: '2024-07-16', required: false })
  startDateAd: Date | null;

  @ApiProperty({ example: '2025-07-15', required: false })
  endDateAd: Date | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
