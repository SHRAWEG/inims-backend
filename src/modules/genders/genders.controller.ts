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
import { GendersService } from './genders.service';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { QueryGenderDto } from './dto/query-gender.dto';
import { GenderResponseDto } from './dto/gender-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { FindOneQueryDto } from '../../common/dto/find-one-query.dto';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('genders')
@ApiBearerAuth('access-token')
@Controller('genders')
export class GendersController {
  constructor(private readonly gendersService: GendersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new gender' })
  @ApiResponse({ status: 201, type: GenderResponseDto })
  async create(@Body() createDto: CreateGenderDto) {
    const data = await this.gendersService.create(createDto);
    return buildResponse(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all genders' })
  @ApiResponse({ status: 200, type: [GenderResponseDto] })
  async findAll(@Query() query: QueryGenderDto) {
    const result = await this.gendersService.findAll(query);
    return buildResponse(result.data, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gender by id' })
  @ApiResponse({ status: 200, type: GenderResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FindOneQueryDto,
  ) {
    const data = await this.gendersService.findById(
      id,
      query.locale,
      query.withTranslations === true,
    );
    return buildResponse(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a gender' })
  @ApiResponse({ status: 200, type: GenderResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateGenderDto,
  ) {
    const data = await this.gendersService.update(id, updateDto);
    return buildResponse(data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a gender' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.gendersService.remove(id);
  }
}
