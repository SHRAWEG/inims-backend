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
import { AgeGroupsService } from './age-groups.service';
import { CreateAgeGroupDto } from './dto/create-age-group.dto';
import { UpdateAgeGroupDto } from './dto/update-age-group.dto';
import { QueryAgeGroupDto } from './dto/query-age-group.dto';
import { AgeGroupResponseDto } from './dto/age-group-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('age-groups')
@ApiBearerAuth('access-token')
@Controller('age-groups')
export class AgeGroupsController {
  constructor(private readonly ageGroupsService: AgeGroupsService) {}

  @Post()
  @Permissions('age-groups:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new age group' })
  @ApiResponse({ status: 201, type: AgeGroupResponseDto })
  async create(@Body() createDto: CreateAgeGroupDto) {
    const data = await this.ageGroupsService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @Permissions('age-groups:view')
  @ApiOperation({ summary: 'Get all age groups' })
  @ApiResponse({ status: 200, type: [AgeGroupResponseDto] })
  async findAll(@Query() query: QueryAgeGroupDto) {
    const result = await this.ageGroupsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Permissions('age-groups:view')
  @ApiOperation({ summary: 'Get an age group by id' })
  @ApiResponse({ status: 200, type: AgeGroupResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindOneQueryDto,
  ) {
    const data = await this.ageGroupsService.findById(
      id,
      query.locale,
      query.withTranslations === true,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('age-groups:update')
  @ApiOperation({ summary: 'Update an age group' })
  @ApiResponse({ status: 200, type: AgeGroupResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAgeGroupDto,
  ) {
    const data = await this.ageGroupsService.update(id, updateDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('age-groups:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an age group' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.ageGroupsService.remove(id);
  }
}
