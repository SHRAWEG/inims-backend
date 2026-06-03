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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MsnpIndicatorDataService } from './msnp-indicator-data.service';
import { CreateMsnpIndicatorDataDto } from './dto/create-msnp-indicator-data.dto';
import { UpdateMsnpIndicatorDataDto } from './dto/update-msnp-indicator-data.dto';
import { BulkUpsertMsnpIndicatorDataDto } from './dto/bulk-upsert-msnp-indicator-data.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { QueryMsnpIndicatorDataDto } from './dto/query-msnp-indicator-data.dto';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { Request } from 'express';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('MSNP Indicator Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('msnp-indicator-data')
export class MsnpIndicatorDataController {
  constructor(
    private readonly msnpIndicatorDataService: MsnpIndicatorDataService,
  ) {}

  @Post()
  @Permissions('msnp_indicator_data:create')
  @ApiOperation({ summary: 'Create new indicator data' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(
    @Body() createDto: CreateMsnpIndicatorDataDto,
    @Req() req: Request,
  ) {
    const user = req.user as { sub?: string; id?: string };
    const data = await this.msnpIndicatorDataService.create(
      createDto,
      (user.sub || user.id) as string,
    );
    return buildResponse(data);
  }

  @Post('bulk')
  @Permissions('msnp_indicator_data:create')
  @ApiOperation({ summary: 'Bulk upsert indicator data for a fiscal year' })
  @ApiResponse({ status: 201, description: 'Bulk upserted successfully' })
  async bulkUpsert(
    @Body() bulkDto: BulkUpsertMsnpIndicatorDataDto,
    @Req() req: Request,
  ) {
    const user = req.user as { sub?: string; id?: string };
    const data = await this.msnpIndicatorDataService.bulkUpsert(
      bulkDto,
      (user.sub || user.id) as string,
    );
    return buildResponse(data);
  }

  @Get()
  @Permissions('msnp_indicator_data:read')
  @ApiOperation({ summary: 'Get data entry form configurations' })
  @ApiResponse({
    status: 200,
    description: 'Return array of form configurations',
  })
  async findAll(
    @Query() query: QueryMsnpIndicatorDataDto,
    @Req() req: Request,
  ) {
    const user = req.user as { sub?: string; id?: string; roleId?: string };
    const result = await this.msnpIndicatorDataService.findAll(
      query,
      user.roleId,
    );
    return buildResponse(result);
  }

  @Get(':id')
  @Permissions('msnp_indicator_data:read')
  @ApiOperation({ summary: 'Get indicator data by ID' })
  @ApiResponse({ status: 200, description: 'Return detail' })
  async findOne(@Param('id') id: string, @Query() query: LocaleQueryDto) {
    const data = await this.msnpIndicatorDataService.findById(id, query.locale);
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('msnp_indicator_data:update')
  @ApiOperation({ summary: 'Update indicator data' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMsnpIndicatorDataDto,
  ) {
    const data = await this.msnpIndicatorDataService.update(id, updateDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('msnp_indicator_data:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete indicator data' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.msnpIndicatorDataService.remove(id);
  }
}
