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
import { MsnpIndicatorsService } from './msnp-indicators.service';
import { CreateMsnpIndicatorDto } from './dto/create-msnp-indicator.dto';
import { UpdateMsnpIndicatorDto } from './dto/update-msnp-indicator.dto';
import { QueryMsnpIndicatorDto } from './dto/query-msnp-indicator.dto';
import { MsnpIndicatorResponseDto } from './dto/msnp-indicator-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('msnp-indicators')
@ApiBearerAuth('access-token')
@Controller('msnp-indicators')
export class MsnpIndicatorsController {
  constructor(private readonly msnpIndicatorsService: MsnpIndicatorsService) {}

  @Post()
  @Permissions('msnp-indicators:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new msnp indicator' })
  @ApiResponse({ status: 201, type: MsnpIndicatorResponseDto })
  async create(@Body() createDto: CreateMsnpIndicatorDto) {
    const data = await this.msnpIndicatorsService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('msnp-indicators:view')
  @ApiOperation({ summary: 'Get all msnp indicators' })
  @ApiResponse({ status: 200, type: [MsnpIndicatorResponseDto] })
  async findAll(@Query() query: QueryMsnpIndicatorDto) {
    const result = await this.msnpIndicatorsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('msnp-indicators:view')
  @ApiOperation({ summary: 'Get an msnp indicator by id' })
  @ApiResponse({ status: 200, type: MsnpIndicatorResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindOneQueryDto,
  ) {
    const data = await this.msnpIndicatorsService.findById(
      id,
      query.locale,
      query.withTranslations === true,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('msnp-indicators:update')
  @ApiOperation({ summary: 'Update an msnp indicator' })
  @ApiResponse({ status: 200, type: MsnpIndicatorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMsnpIndicatorDto,
  ) {
    const data = await this.msnpIndicatorsService.update(id, updateDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('msnp-indicators:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an msnp indicator' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.msnpIndicatorsService.remove(id);
  }
}
