import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MsnpIndicatorTargetsService } from './msnp-indicator-targets.service';
import { CreateMsnpIndicatorTargetDto } from './dto/create-msnp-indicator-target.dto';
import { UpdateMsnpIndicatorTargetDto } from './dto/update-msnp-indicator-target.dto';
import { BulkUpsertMsnpIndicatorTargetDto } from './dto/bulk-upsert-msnp-indicator-target.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { QueryMsnpIndicatorTargetDto } from './dto/query-msnp-indicator-target.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('MSNP Indicator Targets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('msnp-indicator-targets')
export class MsnpIndicatorTargetsController {
  constructor(
    private readonly msnpIndicatorTargetsService: MsnpIndicatorTargetsService,
  ) {}

  @Post()
  @Permissions('msnp_indicator_targets:create')
  @ApiOperation({ summary: 'Create new indicator target' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() createDto: CreateMsnpIndicatorTargetDto) {
    const data = await this.msnpIndicatorTargetsService.create(createDto);
    return buildResponse(data);
  }

  @Post('bulk')
  @Permissions('msnp_indicator_targets:create')
  @ApiOperation({ summary: 'Bulk upsert indicator targets for a fiscal year' })
  @ApiResponse({ status: 201, description: 'Bulk upserted successfully' })
  async bulkUpsert(@Body() bulkDto: BulkUpsertMsnpIndicatorTargetDto) {
    const data = await this.msnpIndicatorTargetsService.bulkUpsert(bulkDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('msnp_indicator_targets:read')
  @ApiOperation({ summary: 'Get all indicator targets with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated list' })
  async findAll(@Query() query: QueryMsnpIndicatorTargetDto) {
    const result = await this.msnpIndicatorTargetsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('msnp_indicator_targets:read')
  @ApiOperation({ summary: 'Get indicator target by ID' })
  @ApiResponse({ status: 200, description: 'Return detail' })
  async findOne(@Param('id') id: string) {
    const data = await this.msnpIndicatorTargetsService.findById(id);
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('msnp_indicator_targets:update')
  @ApiOperation({ summary: 'Update indicator target' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMsnpIndicatorTargetDto,
  ) {
    const data = await this.msnpIndicatorTargetsService.update(id, updateDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('msnp_indicator_targets:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete indicator target' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.msnpIndicatorTargetsService.remove(id);
  }
}
