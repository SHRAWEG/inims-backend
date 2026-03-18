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
import { AdministrativeLevelsService } from './administrative-levels.service';
import { CreateAdministrativeLevelDto } from './dto/create-administrative-level.dto';
import { UpdateAdministrativeLevelDto } from './dto/update-administrative-level.dto';
import { QueryAdministrativeLevelDto } from './dto/query-administrative-level.dto';
import { AdministrativeLevelResponseDto } from './dto/administrative-level-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('administrative-levels')
@ApiBearerAuth('access-token')
@Controller('administrative-levels')
export class AdministrativeLevelsController {
  constructor(
    private readonly administrativeLevelsService: AdministrativeLevelsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new administrative level' })
  @ApiResponse({ status: 201, type: AdministrativeLevelResponseDto })
  async create(@Body() createDto: CreateAdministrativeLevelDto) {
    const data = await this.administrativeLevelsService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all administrative levels' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [AdministrativeLevelResponseDto] })
  async findAll(
    @Query() query: QueryAdministrativeLevelDto,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const { data, total } = await this.administrativeLevelsService.findAll(
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
  @ApiOperation({ summary: 'Get an administrative level by id' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: AdministrativeLevelResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const data = await this.administrativeLevelsService.findOne(
      id,
      locale,
      String(withTranslations) === 'true',
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an administrative level' })
  @ApiResponse({ status: 200, type: AdministrativeLevelResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAdministrativeLevelDto,
  ) {
    const data = await this.administrativeLevelsService.update(id, updateDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an administrative level' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.administrativeLevelsService.remove(id);
  }
}
