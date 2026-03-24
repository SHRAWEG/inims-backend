import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserFilterDto } from './dto/user-filter.dto';
import { FindOptionsWhere, ILike, Not, IsNull } from 'typeorm';
import { UserContext } from '../../common/types/user-context.type';
import { SystemRole } from '../../common/enums/system-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private validateRoleAssignment(
    systemRole?: string | null,
    roleId?: string | null,
  ) {
    if (systemRole && roleId) {
      throw new BadRequestException(
        'A user cannot have both a SystemRole and a custom Role',
      );
    }
  }

  async findAll(
    filter?: UserFilterDto,
    requester?: UserContext,
  ): Promise<User[]> {
    const where: FindOptionsWhere<User>[] = [];
    const visibilityFilter: FindOptionsWhere<User> = {};

    // Apply hierarchical visibility filters
    if (requester) {
      if (requester.systemRole === SystemRole.ADMIN) {
        // Admins cannot see Super Admins
        visibilityFilter.systemRole = Not(SystemRole.SUPER_ADMIN);
      } else if (!requester.systemRole) {
        // Custom roles can only see other custom roles (systemRole is null)
        visibilityFilter.systemRole = IsNull();
      }
      // Super Admins see everyone (no extra filter)
    }

    if (filter) {
      const baseWhere: FindOptionsWhere<User> = { ...visibilityFilter };
      if (filter.systemRole) baseWhere.systemRole = filter.systemRole;
      if (filter.roleId) baseWhere.roleId = filter.roleId;
      if (filter.isActive !== undefined) baseWhere.isActive = filter.isActive;

      if (filter.searchTerm) {
        const term = `%${filter.searchTerm}%`;
        where.push(
          { ...baseWhere, email: ILike(term) },
          { ...baseWhere, firstName: ILike(term) },
          { ...baseWhere, lastName: ILike(term) },
        );
      } else if (Object.keys(baseWhere).length > 0) {
        where.push(baseWhere);
      }
    } else if (Object.keys(visibilityFilter).length > 0) {
      where.push(visibilityFilter);
    }

    return this.userRepository.find({
      where: where.length > 0 ? where : undefined,
      relations: ['role', 'role.permissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    this.validateRoleAssignment(dto.systemRole, dto.roleId);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    return this.userRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    this.validateRoleAssignment(
      dto.systemRole ?? user.systemRole,
      dto.roleId ?? user.roleId,
    );

    Object.assign(user, dto);
    if (dto.email) user.email = dto.email.toLowerCase();

    return this.userRepository.save(user);
  }

  toResponseDto(user: User): UserResponseDto {
    const permissions =
      user.role?.permissions?.map((p) => `${p.resource}:${p.action}`) ?? [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      systemRole: user.systemRole,
      roleId: user.roleId,
      roleName: user.role?.name || user.systemRole || null,
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
