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
  ApiParam,
} from '@nestjs/swagger';
import { ChildContentsService } from './child-contents.service';
import { CreateChildContentDto } from './dto/create-child-content.dto';
import { UpdateChildContentDto } from './dto/update-child-content.dto';
import { QueryChildContentDto } from './dto/query-child-content.dto';
import { ChildContentResponseDto } from './dto/child-content-response.dto';
import { ChildContentSummaryResponseDto } from './dto/child-content-summary-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('child-contents')
@ApiBearerAuth('access-token')
@Controller('child-contents')
export class ChildContentsController {
  constructor(private readonly childContentsService: ChildContentsService) {}

  @Post()
  @Permissions('child-contents:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new child content entry' })
  @ApiResponse({ status: 201, type: ChildContentResponseDto })
  async create(@Body() dto: CreateChildContentDto) {
    const data = await this.childContentsService.create(dto);
    return buildResponse(data);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all child contents (paginated)' })
  @ApiResponse({ status: 200, type: ChildContentSummaryResponseDto })
  async findAll(@Query() query: QueryChildContentDto) {
    const result = await this.childContentsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a child content by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ChildContentResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.childContentsService.findById(id);
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('child-contents:update')
  @ApiOperation({ summary: 'Update a child content entry' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ChildContentResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChildContentDto,
  ) {
    const data = await this.childContentsService.update(id, dto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('child-contents:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a child content entry' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.childContentsService.remove(id);
  }
}
