import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditAction } from '../../../common/enums/audit-action.enum';

export class AuditLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by acting user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: AuditAction,
    description: 'Filter by action type',
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filter by resource name (e.g., user, product)',
  })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ description: 'Filter by specific resource ID' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Filter logs from this date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter logs up to this date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
