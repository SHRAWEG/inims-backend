import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
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
}
