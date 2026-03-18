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
import { TypesService } from './types.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { QueryTypeDto } from './dto/query-type.dto';
import { TypeResponseDto } from './dto/type-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('types')
@ApiBearerAuth('access-token')
@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new type' })
  @ApiResponse({ status: 201, type: TypeResponseDto })
  async create(@Body() createTypeDto: CreateTypeDto) {
    const data = await this.typesService.create(createTypeDto);
    return buildResponse(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all types' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [TypeResponseDto] })
  async findAll(
    @Query() query: QueryTypeDto,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const { data, total } = await this.typesService.findAll(
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
  @ApiOperation({ summary: 'Get a type by id' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'ne'] })
  @ApiQuery({ name: 'withTranslations', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: TypeResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('locale') locale: SupportedLocale = DEFAULT_LOCALE,
    @Query('withTranslations') withTranslations = false,
  ) {
    const data = await this.typesService.findOne(
      id,
      locale,
      String(withTranslations) === 'true',
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a type' })
  @ApiResponse({ status: 200, type: TypeResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTypeDto: UpdateTypeDto,
  ) {
    const data = await this.typesService.update(id, updateTypeDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a type' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.typesService.remove(id);
  }
}
