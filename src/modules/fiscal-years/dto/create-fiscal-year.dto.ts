import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsDateString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFiscalYearDto {
  @ApiProperty({ example: '2081/82', description: 'BS Fiscal Year' })
  @IsString()
  @IsNotEmpty()
  @Length(7, 7)
  year: string;

  @ApiProperty({
    example: '2024/25',
    required: false,
    description: 'AD Fiscal Year',
  })
  @IsString()
  @IsOptional()
  dateInAd?: string;

  @ApiProperty({ example: '2024-07-16', required: false })
  @IsDateString()
  @IsOptional()
  startDateAd?: Date;

  @ApiProperty({ example: '2025-07-15', required: false })
  @IsDateString()
  @IsOptional()
  endDateAd?: Date;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
