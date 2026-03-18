import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class DateRangeQueryDto {
  @ApiProperty({
    example: '2025-01-01',
    description: 'Start date (ISO format)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-31', description: 'End date (ISO format)' })
  @IsDateString()
  endDate: string;
}
