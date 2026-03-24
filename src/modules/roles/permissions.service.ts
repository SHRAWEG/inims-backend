import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionResponseDto } from './dto/role-response.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  toResponseDto(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      category: permission.category,
    };
  }
}
