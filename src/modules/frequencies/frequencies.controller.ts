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
  ApiQuery,
} from '@nestjs/swagger';
import { FrequenciesService } from './frequencies.service';
import { CreateFrequencyDto } from './dto/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/update-frequency.dto';
import { QueryFrequencyDto } from './dto/query-frequency.dto';
import { FrequencyResponseDto } from './dto/frequency-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('frequencies')
@ApiBearerAuth('access-token')
@Controller('frequencies')
export class FrequenciesController {
  constructor(private readonly frequenciesService: FrequenciesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new frequency' })
  @ApiResponse({ status: 201, type: FrequencyResponseDto })
  async create(@Body() createDto: CreateFrequencyDto) {
    const data = await this.frequenciesService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all frequencies' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [FrequencyResponseDto] })
  async findAll(
    @Query() query: QueryFrequencyDto,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const { data, total } = await this.frequenciesService.findAll(
      query,
      locale,
      String(withTranslations) === 'true',
    );
    return buildResponse(data, {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a frequency by id' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: FrequencyResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const data = await this.frequenciesService.findOne(
      id,
      locale,
      String(withTranslations) === 'true',
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a frequency' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.frequenciesService.remove(id);
  }
}
