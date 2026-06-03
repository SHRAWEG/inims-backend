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
import { DisaggregationOptionsService } from './disaggregation-options.service';
import { CreateDisaggregationOptionDto } from './dto/create-disaggregation-option.dto';
import { UpdateDisaggregationOptionDto } from './dto/update-disaggregation-option.dto';
import { QueryDisaggregationOptionDto } from './dto/query-disaggregation-option.dto';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('disaggregation-options')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('disaggregation-options')
export class DisaggregationOptionsController {
  constructor(
    private readonly disaggregationOptionsService: DisaggregationOptionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new disaggregation option' })
  async create(
    @Body() createDisaggregationOptionDto: CreateDisaggregationOptionDto,
  ) {
    const data = await this.disaggregationOptionsService.create(
      createDisaggregationOptionDto,
    );
    return buildResponse(
      data,
      undefined,
      'Disaggregation option created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all disaggregation options' })
  async findAll(@Query() query: QueryDisaggregationOptionDto) {
    const { data, meta } =
      await this.disaggregationOptionsService.findAll(query);
    return buildResponse(
      data,
      meta,
      'Disaggregation options retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a disaggregation option by id' })
  async findOne(@Param('id') id: string, @Query() query: LocaleQueryDto) {
    const data = await this.disaggregationOptionsService.findOne(
      id,
      query.locale,
    );
    return buildResponse(
      data,
      undefined,
      'Disaggregation option retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a disaggregation option' })
  async update(
    @Param('id') id: string,
    @Body() updateDisaggregationOptionDto: UpdateDisaggregationOptionDto,
  ) {
    const data = await this.disaggregationOptionsService.update(
      id,
      updateDisaggregationOptionDto,
    );
    return buildResponse(
      data,
      undefined,
      'Disaggregation option updated successfully',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a disaggregation option' })
  async remove(@Param('id') id: string) {
    await this.disaggregationOptionsService.remove(id);
    return buildResponse(
      null,
      undefined,
      'Disaggregation option deleted successfully',
    );
  }
}
