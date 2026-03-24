import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { RoleFilterDto } from './dto/role-filter.dto';
import { FindOptionsWhere, ILike } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Role with name "${dto.name}" already exists`,
      );
    }

    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      role.permissions = await this.permissionRepository.findBy({
        id: In(dto.permissionIds),
      });
    }

    return this.roleRepository.save(role);
  }

  async findAll(filter?: RoleFilterDto): Promise<Role[]> {
    const where: FindOptionsWhere<Role> = {};

    if (filter) {
      if (filter.isActive !== undefined) where.isActive = filter.isActive;
      if (filter.searchTerm) {
        where.name = ILike(`%${filter.searchTerm}%`);
      }
    }

    return this.roleRepository.find({
      where,
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Role with name "${dto.name}" already exists`,
        );
      }
      role.name = dto.name;
    }

    if (dto.description !== undefined) role.description = dto.description;
    if (dto.isActive !== undefined) role.isActive = dto.isActive;

    if (dto.permissionIds) {
      role.permissions = await this.permissionRepository.findBy({
        id: In(dto.permissionIds),
      });
    }

    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }

  async getRolePermissionKeys(roleId: string): Promise<string[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role || !role.isActive) return [];

    return role.permissions.map((p) => `${p.resource}:${p.action}`);
  }

  async roleHasPermissions(
    roleId: string,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getRolePermissionKeys(roleId);
    return permissions.every((p) => userPermissions.includes(p));
  }

  toResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      permissions: role.permissions.map((p) => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
        description: p.description,
        category: p.category,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
