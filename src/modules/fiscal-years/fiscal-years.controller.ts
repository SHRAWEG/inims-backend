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
import { FiscalYearsService } from './fiscal-years.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from './dto/update-fiscal-year.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { QueryFiscalYearDto } from './dto/query-fiscal-year.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('Fiscal Years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('fiscal-years')
export class FiscalYearsController {
  constructor(private readonly fiscalYearsService: FiscalYearsService) {}

  @Post()
  @Permissions('fiscal_years:create')
  @ApiOperation({ summary: 'Create a new fiscal year' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() createDto: CreateFiscalYearDto) {
    const data = await this.fiscalYearsService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('fiscal_years:read')
  @ApiOperation({ summary: 'Get all fiscal years with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated list' })
  async findAll(@Query() query: QueryFiscalYearDto) {
    const result = await this.fiscalYearsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('fiscal_years:read')
  @ApiOperation({ summary: 'Get a fiscal year by ID' })
  @ApiResponse({ status: 200, description: 'Return fiscal year detail' })
  async findOne(@Param('id') id: string) {
    const data = await this.fiscalYearsService.findById(id);
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('fiscal_years:update')
  @ApiOperation({ summary: 'Update a fiscal year' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFiscalYearDto,
  ) {
    const data = await this.fiscalYearsService.update(id, updateDto);
    return buildResponse(data);
  }

  @Patch(':id/set-active')
  @Permissions('fiscal_years:update')
  @ApiOperation({ summary: 'Set a fiscal year as active' })
  @ApiResponse({ status: 200, description: 'Successfully set active' })
  async setActive(@Param('id') id: string) {
    const data = await this.fiscalYearsService.setActive(id);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('fiscal_years:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a fiscal year' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.fiscalYearsService.remove(id);
  }
}
