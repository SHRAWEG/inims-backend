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
import { TypesService } from './types.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { QueryTypeDto } from './dto/query-type.dto';
import { TypeResponseDto } from './dto/type-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('types')
@ApiBearerAuth('access-token')
@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Post()
  @Permissions('types:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new type' })
  @ApiResponse({ status: 201, type: TypeResponseDto })
  async create(@Body() createTypeDto: CreateTypeDto) {
    const data = await this.typesService.create(createTypeDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('types:view')
  @ApiOperation({ summary: 'Get all types' })
  @ApiResponse({ status: 200, type: [TypeResponseDto] })
  async findAll(@Query() query: QueryTypeDto) {
    const result = await this.typesService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('types:view')
  @ApiOperation({ summary: 'Get a type by id' })
  @ApiResponse({ status: 200, type: TypeResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindOneQueryDto,
  ) {
    const data = await this.typesService.findById(
      id,
      query.locale,
      query.withTranslations === true,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('types:update')
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
  @Permissions('types:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a type' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.typesService.remove(id);
  }
}
