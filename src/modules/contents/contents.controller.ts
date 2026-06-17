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
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { ContentResponseDto } from './dto/content-response.dto';
import { ContentSummaryResponseDto } from './dto/content-summary-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { buildResponse } from '../../common/utils/response.util';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';

@ApiTags('contents')
@ApiBearerAuth('access-token')
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Post()
  @Permissions('contents:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new content entry' })
  @ApiResponse({ status: 201, type: ContentResponseDto })
  @ApiResponse({ status: 409, description: 'Title or slug already exists' })
  async create(@Body() dto: CreateContentDto) {
    const data = await this.contentsService.create(dto);
    return buildResponse(data);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all content entries (paginated)' })
  @ApiResponse({ status: 200, type: ContentSummaryResponseDto })
  async findAll(@Query() query: QueryContentDto) {
    const result = await this.contentsService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get a content entry by slug' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Param('slug') slug: string,
    @Query() localeQuery: LocaleQueryDto,
  ) {
    const data = await this.contentsService.findBySlug(
      slug,
      localeQuery.locale,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Permissions('contents:update')
  @ApiOperation({ summary: 'Update a content entry' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Title or slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
    @Query() localeQuery: LocaleQueryDto,
  ) {
    const data = await this.contentsService.update(id, dto, localeQuery.locale);
    return buildResponse(data);
  }

  @Delete(':id')
  @Permissions('contents:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content entry (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentsService.remove(id);
  }
}
