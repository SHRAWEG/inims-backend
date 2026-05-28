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
import { MsnpIndicatorConfigurationsService } from './msnp-indicator-configurations.service';
import { CreateMsnpIndicatorConfigurationDto } from './dto/create-msnp-indicator-configuration.dto';
import { UpdateMsnpIndicatorConfigurationDto } from './dto/update-msnp-indicator-configuration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { QueryMsnpIndicatorConfigurationDto } from './dto/query-msnp-indicator-configuration.dto';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('MSNP Indicator Configurations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('msnp-indicator-configurations')
export class MsnpIndicatorConfigurationsController {
  constructor(
    private readonly msnpIndicatorConfigurationsService: MsnpIndicatorConfigurationsService,
  ) {}

  @Post()
  @Permissions('msnp_indicator_configurations:create')
  @ApiOperation({ summary: 'Create a new indicator configuration' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() createDto: CreateMsnpIndicatorConfigurationDto) {
    const data =
      await this.msnpIndicatorConfigurationsService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('msnp_indicator_configurations:read')
  @ApiOperation({ summary: 'Get all indicator configurations with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated list' })
  async findAll(@Query() query: QueryMsnpIndicatorConfigurationDto) {
    const result = await this.msnpIndicatorConfigurationsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('msnp_indicator_configurations:read')
  @ApiOperation({ summary: 'Get an indicator configuration by ID' })
  @ApiResponse({ status: 200, description: 'Return detail' })
  async findOne(@Param('id') id: string, @Query() query: FindOneQueryDto) {
    const data = await this.msnpIndicatorConfigurationsService.findById(
      id,
      query.locale,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('msnp_indicator_configurations:update')
  @ApiOperation({ summary: 'Update an indicator configuration' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMsnpIndicatorConfigurationDto,
  ) {
    const data = await this.msnpIndicatorConfigurationsService.update(
      id,
      updateDto,
    );
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('msnp_indicator_configurations:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an indicator configuration' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.msnpIndicatorConfigurationsService.remove(id);
  }
}
