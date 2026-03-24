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
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../common/types/user-context.type';

@ApiTags('roles-permissions')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @Permissions('roles:create')
  @ApiOperation({ summary: 'Create a new custom role' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: UserContext,
  ) {
    const data = await this.rolesService.create(createRoleDto);

    await this.auditLogService.log({
      action: AuditAction.CREATE,
      resource: 'role',
      resourceId: data.id,
      userId: user.id,
      after: data as unknown as Record<string, unknown>,
    });

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
    @CurrentUser() user: UserContext,
  ) {
    const oldRole = await this.rolesService.findOne(id);
    const data = await this.rolesService.update(id, updateRoleDto);

    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      resource: 'role',
      resourceId: data.id,
      userId: user.id,
      before: oldRole as unknown as Record<string, unknown>,
      after: data as unknown as Record<string, unknown>,
    });

    return buildResponse(this.rolesService.toResponseDto(data));
  }

  @Delete(':id')
  @Permissions('roles:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: UserContext,
  ) {
    const oldRole = await this.rolesService.findOne(id);
    await this.rolesService.remove(id);

    await this.auditLogService.log({
      action: AuditAction.DELETE,
      resource: 'role',
      resourceId: id,
      userId: user.id,
      before: oldRole as unknown as Record<string, unknown>,
    });
  }
}
