import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgeGroup } from './entities/age-group.entity';
import { CreateAgeGroupDto } from './dto/create-age-group.dto';
import { UpdateAgeGroupDto } from './dto/update-age-group.dto';
import {
  AgeGroupResponseDto,
  AgeGroupDetailResponseDto,
} from './dto/age-group-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import { LocalizedField } from '../../common/types/i18n.type';

@Injectable()
export class AgeGroupsService {
  private readonly logger = new Logger(AgeGroupsService.name);

  constructor(
    @InjectRepository(AgeGroup)
    private readonly ageGroupRepository: Repository<AgeGroup>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateAgeGroupDto): Promise<AgeGroupResponseDto> {
    try {
      const entity = this.ageGroupRepository.create({
        name: { en: dto.name.en, ne: dto.name.ne },
        isActive: dto.isActive ?? true,
      });
      const saved = await this.ageGroupRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'age-group',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create age group', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(
    query: LocaleQueryDto &
      PaginationQueryDto & { search?: string; isActive?: boolean },
  ) {
    const qb = this.ageGroupRepository
      .createQueryBuilder('ageGroup')
      .where('ageGroup.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        `(ageGroup.name->>'en' ILIKE :search OR ageGroup.name->>'ne' ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('ageGroup.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    qb.orderBy(`ageGroup.name->>'${query.locale}'`, 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((ag) => this.toResponse(ag, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(
    id: string,
    locale: SupportedLocale,
    withTranslations?: boolean,
  ): Promise<AgeGroupResponseDto | AgeGroupDetailResponseDto> {
    const entity = await this.ageGroupRepository.findOne({ where: { id } });

    if (!entity) {
      throw new EntityNotFoundException('AgeGroup', id);
    }

    if (withTranslations) {
      return {
        id: entity.id,
        name: entity.name,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      };
    }

    return this.toResponse(entity, locale);
  }

  async update(
    id: string,
    dto: UpdateAgeGroupDto,
  ): Promise<AgeGroupResponseDto> {
    try {
      const existing = await this.ageGroupRepository.findOneOrFail({
        where: { id },
      });
      const before = { ...existing };

      const updatedName: LocalizedField = {
        en: dto.name?.en ?? existing.name.en,
        ne: dto.name?.ne ?? existing.name.ne,
      };

      const updated = await this.ageGroupRepository.save({
        ...existing,
        ...dto,
        name: updatedName,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'age-group',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update age group: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const entity = await this.ageGroupRepository.findOne({ where: { id } });
    if (!entity) {
      throw new EntityNotFoundException('AgeGroup', id);
    }

    await this.ageGroupRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'age-group',
      resourceId: id,
      before: sanitizeForAudit(entity),
    });
  }

  private toResponse(
    entity: AgeGroup,
    locale: SupportedLocale,
  ): AgeGroupResponseDto {
    return {
      id: entity.id,
      name: entity.name[locale] ?? entity.name['en'],
      isActive: entity.isActive,
      locale,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private handleDbError(error: any): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23505') {
      throw new BusinessLogicException(`Duplicate entry: ${err.detail}`);
    }
    if (err?.code === '23503') {
      throw new BusinessLogicException('Referenced record does not exist');
    }
    throw error;
  }
}
