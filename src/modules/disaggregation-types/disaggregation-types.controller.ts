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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisaggregationTypesService } from './disaggregation-types.service';
import { CreateDisaggregationTypeDto } from './dto/create-disaggregation-type.dto';
import { UpdateDisaggregationTypeDto } from './dto/update-disaggregation-type.dto';
import { QueryDisaggregationTypeDto } from './dto/query-disaggregation-type.dto';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('disaggregation-types')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('disaggregation-types')
export class DisaggregationTypesController {
  constructor(
    private readonly disaggregationTypesService: DisaggregationTypesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new disaggregation type' })
  async create(
    @Body() createDisaggregationTypeDto: CreateDisaggregationTypeDto,
  ) {
    const data = await this.disaggregationTypesService.create(
      createDisaggregationTypeDto,
    );
    return buildResponse(
      data,
      undefined,
      'Disaggregation type created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all disaggregation types' })
  async findAll(@Query() query: QueryDisaggregationTypeDto) {
    const { data, meta } = await this.disaggregationTypesService.findAll(query);
    return buildResponse(
      data,
      meta,
      'Disaggregation types retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a disaggregation type by id' })
  async findOne(@Param('id') id: string, @Query() query: LocaleQueryDto) {
    const data = await this.disaggregationTypesService.findOne(
      id,
      query.locale,
    );
    return buildResponse(
      data,
      undefined,
      'Disaggregation type retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a disaggregation type' })
  async update(
    @Param('id') id: string,
    @Body() updateDisaggregationTypeDto: UpdateDisaggregationTypeDto,
  ) {
    const data = await this.disaggregationTypesService.update(
      id,
      updateDisaggregationTypeDto,
    );
    return buildResponse(
      data,
      undefined,
      'Disaggregation type updated successfully',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a disaggregation type' })
  async remove(@Param('id') id: string) {
    await this.disaggregationTypesService.remove(id);
    return buildResponse(
      null,
      undefined,
      'Disaggregation type deleted successfully',
    );
  }
}
