import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionResponseDto } from './dto/role-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { buildResponse } from '../../common/utils/response.util';

@ApiTags('roles-permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('permissions:view')
  @ApiOperation({ summary: 'List all available permissions' })
  @ApiResponse({ status: 200, type: [PermissionResponseDto] })
  async findAll() {
    const data = await this.permissionsService.findAll();
    return buildResponse(
      data.map((p) => this.permissionsService.toResponseDto(p)),
    );
  }
}
