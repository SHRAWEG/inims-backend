import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLog } from './entities/audit-log.entity';
import { ApiResponse } from '../../common/types/api-response.type';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('Audit Logs')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions('audit-logs:view')
  @ApiOperation({ summary: 'Get audit logs' })
  async findAll(
    @Query() query: AuditLogQueryDto,
  ): Promise<ApiResponse<AuditLog[]>> {
    const result: { items: AuditLog[]; total: number } =
      await this.auditLogService.findAll(query);
    const { items, total } = result;
    const meta = buildPaginationMeta(total, query.page, query.limit);
    return buildResponse(items, meta);
  }

  @Get(':id')
  @Permissions('audit-logs:view')
  @ApiOperation({ summary: 'Get a specific audit log (Admin only)' })
  async findOne(
    @Param('id', ParseUuidPipe) id: string,
  ): Promise<ApiResponse<AuditLog>> {
    const log = await this.auditLogService.findOne(id);
    return buildResponse(log);
  }
}
