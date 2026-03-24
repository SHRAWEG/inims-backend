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
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { QuerySectorDto } from './dto/query-sector.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('sectors')
@ApiBearerAuth('access-token')
@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Post()
  @Permissions('sectors:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sector' })
  @ApiResponse({ status: 201, type: SectorResponseDto })
  async create(@Body() createSectorDto: CreateSectorDto) {
    const data = await this.sectorsService.create(createSectorDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('sectors:view')
  @ApiOperation({ summary: 'Get all sectors' })
  @ApiResponse({ status: 200, type: [SectorResponseDto] })
  async findAll(@Query() query: QuerySectorDto) {
    const result = await this.sectorsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('sectors:view')
  @ApiOperation({ summary: 'Get a sector by id' })
  @ApiResponse({ status: 200, type: SectorResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindOneQueryDto,
  ) {
    const data = await this.sectorsService.findById(
      id,
      query.locale,
      query.withTranslations === true,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('sectors:update')
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
  @Permissions('sectors:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sector' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.sectorsService.remove(id);
  }
}
