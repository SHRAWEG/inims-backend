import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { buildResponse } from '../../common/utils/response.util';
import { QueryIndicatorSummaryDto } from './dto/query-indicator-summary.dto';
import { IndicatorSummaryResponseDto } from './dto/indicator-summary-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('indicator-summary')
  @ApiOperation({
    summary: 'Get indicator summary grouped by type for dashboard',
  })
  @ApiResponse({ status: 200, type: [IndicatorSummaryResponseDto] })
  async getIndicatorSummary(@Query() query: QueryIndicatorSummaryDto) {
    const data = await this.dashboardService.getIndicatorSummary(
      query.filter,
      query.fiscalYearId,
    );
    return buildResponse(data);
  }
}
