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
import { AdministrativeLevelsService } from './administrative-levels.service';
import { CreateAdministrativeLevelDto } from './dto/create-administrative-level.dto';
import { UpdateAdministrativeLevelDto } from './dto/update-administrative-level.dto';
import { QueryAdministrativeLevelDto } from './dto/query-administrative-level.dto';
import { AdministrativeLevelResponseDto } from './dto/administrative-level-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('administrative-levels')
@ApiBearerAuth('access-token')
@Controller('administrative-levels')
export class AdministrativeLevelsController {
  constructor(
    private readonly administrativeLevelsService: AdministrativeLevelsService,
  ) {}

  @Post()
  @Permissions('administrative-levels:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new administrative level' })
  @ApiResponse({ status: 201, type: AdministrativeLevelResponseDto })
  async create(@Body() dto: CreateAdministrativeLevelDto) {
    const data = await this.administrativeLevelsService.create(dto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('administrative-levels:view')
  @ApiOperation({ summary: 'Get all administrative levels' })
  @ApiResponse({ status: 200, type: [AdministrativeLevelResponseDto] })
  async findAll(@Query() query: QueryAdministrativeLevelDto) {
    const result = await this.administrativeLevelsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('administrative-levels:view')
  @ApiOperation({ summary: 'Get an administrative level by id' })
  @ApiResponse({ status: 200, type: AdministrativeLevelResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindOneQueryDto,
  ) {
    const data = await this.administrativeLevelsService.findById(
      id,
      query.locale,
      query.withTranslations === true,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('administrative-levels:update')
  @ApiOperation({ summary: 'Update an administrative level' })
  @ApiResponse({ status: 200, type: AdministrativeLevelResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdministrativeLevelDto,
  ) {
    const data = await this.administrativeLevelsService.update(id, dto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('administrative-levels:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an administrative level' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.administrativeLevelsService.remove(id);
  }
}
