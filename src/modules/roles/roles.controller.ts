import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleFilterDto } from './dto/role-filter.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('roles-permissions')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles:create')
  @ApiOperation({ summary: 'Create a new custom role' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.rolesService.create(createRoleDto);
    return buildResponse(this.rolesService.toResponseDto(data));
  }

  @Get()
  @Permissions('roles:view')
  @ApiOperation({ summary: 'List all custom roles' })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  @ApiQuery({ type: RoleFilterDto, required: false })
  async findAll(@Query() filter: RoleFilterDto) {
    const data = await this.rolesService.findAll(filter);
    return buildResponse(data.map((r) => this.rolesService.toResponseDto(r)));
  }

  @Get(':id')
  @Permissions('roles:view')
  @ApiOperation({ summary: 'Get a custom role by ID' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const data = await this.rolesService.findOne(id);
    return buildResponse(this.rolesService.toResponseDto(data));
  }

  @Patch(':id')
  @Permissions('roles:update')
  @ApiOperation({ summary: 'Update a custom role' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const data = await this.rolesService.update(id, updateRoleDto);
    return buildResponse(this.rolesService.toResponseDto(data));
  }

  @Delete(':id')
  @Permissions('roles:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUuidPipe) id: string) {
    await this.rolesService.remove(id);
  }
}
