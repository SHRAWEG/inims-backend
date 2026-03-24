import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../common/types/user-context.type';
import { buildResponse } from '../../common/utils/response.util';
import { ApiResponse } from '../../common/types/api-response.type';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @SwaggerResponse({
    status: 200,
    description: 'Current user profile retrieved successfully',
    type: UserResponseDto,
  })
  async getMe(
    @CurrentUser() userContext: UserContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.findById(userContext.id);
    return buildResponse(this.usersService.toResponseDto(user));
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @SwaggerResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  async updateMe(
    @CurrentUser() userContext: UserContext,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const oldUser = await this.usersService.findById(userContext.id);
    const updatedUser = await this.usersService.update(userContext.id, dto);

    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: userContext.id,
      userId: userContext.id,
      before: oldUser as unknown as Record<string, unknown>,
      after: updatedUser as unknown as Record<string, unknown>,
    });

    return buildResponse(
      this.usersService.toResponseDto(updatedUser),
      undefined,
      'Profile updated successfully',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('users:view')
  @ApiQuery({ type: UserFilterDto, required: false })
  async findAll(
    @Query() filter: UserFilterDto,
    @CurrentUser() userContext: UserContext,
  ): Promise<ApiResponse<UserResponseDto[]>> {
    const users = await this.usersService.findAll(filter, userContext);
    return buildResponse(users.map((u) => this.usersService.toResponseDto(u)));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create a new user' })
  @SwaggerResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() userContext: UserContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.create(dto);

    await this.auditLogService.log({
      action: AuditAction.CREATE,
      resource: 'user',
      resourceId: user.id,
      userId: userContext.id,
      after: user as unknown as Record<string, unknown>,
    });

    return buildResponse(
      this.usersService.toResponseDto(user),
      undefined,
      'User created successfully',
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update a user' })
  @SwaggerResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() userContext: UserContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    const oldUser = await this.usersService.findById(id);
    const user = await this.usersService.update(id, dto);

    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: user.id,
      userId: userContext.id,
      before: oldUser as unknown as Record<string, unknown>,
      after: user as unknown as Record<string, unknown>,
    });

    return buildResponse(
      this.usersService.toResponseDto(user),
      undefined,
      'User updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('users:delete')
  @ApiOperation({ summary: 'Delete a user' })
  @SwaggerResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() userContext: UserContext,
  ): Promise<void> {
    const oldUser = await this.usersService.findById(id);
    await this.usersService.remove(id);

    await this.auditLogService.log({
      action: AuditAction.DELETE,
      resource: 'user',
      resourceId: id,
      userId: userContext.id,
      before: oldUser as unknown as Record<string, unknown>,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('users:view')
  @ApiOperation({ summary: 'Get user by ID' })
  @SwaggerResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.findById(id);
    return buildResponse(this.usersService.toResponseDto(user));
  }
}
