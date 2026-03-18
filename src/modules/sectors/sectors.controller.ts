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
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { QuerySectorDto } from './dto/query-sector.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('sectors')
@ApiBearerAuth('access-token')
@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sector' })
  @ApiResponse({ status: 201, type: SectorResponseDto })
  async create(@Body() createSectorDto: CreateSectorDto) {
    const data = await this.sectorsService.create(createSectorDto);
    return buildResponse(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sectors' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [SectorResponseDto] })
  async findAll(
    @Query() query: QuerySectorDto,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const { data, total } = await this.sectorsService.findAll(
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
  @ApiOperation({ summary: 'Get a sector by id' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: SectorResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const data = await this.sectorsService.findOne(
      id,
      locale,
      String(withTranslations) === 'true',
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a sector' })
  @ApiResponse({ status: 200, type: SectorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSectorDto: UpdateSectorDto,
  ) {
    const data = await this.sectorsService.update(id, updateSectorDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sector' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.sectorsService.remove(id);
  }
}
