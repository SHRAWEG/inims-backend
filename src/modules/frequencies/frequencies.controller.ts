import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FrequenciesService } from './frequencies.service';
import { CreateFrequencyDto } from './dto/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/update-frequency.dto';
import { QueryFrequencyDto } from './dto/query-frequency.dto';
import { FrequencyResponseDto } from './dto/frequency-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('frequencies')
@ApiBearerAuth('access-token')
@Controller('frequencies')
export class FrequenciesController {
  constructor(private readonly frequenciesService: FrequenciesService) {}

  @Post()
  @Permissions('frequencies:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new frequency' })
  @ApiResponse({ status: 201, type: FrequencyResponseDto })
  async create(@Body() createDto: CreateFrequencyDto) {
    const data = await this.frequenciesService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('frequencies:view')
  @ApiOperation({ summary: 'Get all frequencies' })
  @ApiResponse({ status: 200, type: [FrequencyResponseDto] })
  async findAll(@Query() query: QueryFrequencyDto) {
    const result = await this.frequenciesService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('frequencies:view')
  @ApiOperation({ summary: 'Get a frequency by id' })
  @ApiResponse({ status: 200, type: FrequencyResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindOneQueryDto,
  ) {
    const data = await this.frequenciesService.findById(
      id,
      query.locale,
      query.withTranslations === true,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('frequencies:update')
  @ApiOperation({ summary: 'Update a frequency' })
  @ApiResponse({ status: 200, type: FrequencyResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFrequencyDto,
  ) {
    const data = await this.frequenciesService.update(id, updateDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('frequencies:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a frequency' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.frequenciesService.remove(id);
  }
}
