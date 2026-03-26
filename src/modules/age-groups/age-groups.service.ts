import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, Not } from 'typeorm';
import { BusinessValidationException } from '../../common/exceptions/business-validation.exception';
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
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
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
    const errors: Record<string, string[]> = {};

    const [existingEn, existingNe] = await Promise.all([
      this.ageGroupRepository.findOne({
        where: {
          name: Raw(
            (alias) => `"${alias.replace('.', '"."')}"->>'en' = :nameEn`,
            { nameEn: dto.name.en },
          ),
        },
      }),
      this.ageGroupRepository.findOne({
        where: {
          name: Raw(
            (alias) => `"${alias.replace('.', '"."')}"->>'ne' = :nameNe`,
            { nameNe: dto.name.ne },
          ),
        },
      }),
    ]);

    if (existingEn) errors['name.en'] = ['English name already in use'];
    if (existingNe) errors['name.ne'] = ['Nepali name already in use'];

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }

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
    const existing = await this.ageGroupRepository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('AgeGroup', id);
    }

    const errors: Record<string, string[]> = {};
    const checks: Promise<any>[] = [];

    if (dto.name?.en && dto.name.en !== existing.name.en) {
      checks.push(
        this.ageGroupRepository
          .findOne({
            where: {
              name: Raw(
                (alias) => `"${alias.replace('.', '"."')}"->>'en' = :nameEn`,
                { nameEn: dto.name.en },
              ),
              id: Not(id),
            },
          })
          .then((res) => {
            if (res) errors['name.en'] = ['English name already in use'];
          }),
      );
    }

    if (dto.name?.ne && dto.name.ne !== existing.name.ne) {
      checks.push(
        this.ageGroupRepository
          .findOne({
            where: {
              name: Raw(
                (alias) => `"${alias.replace('.', '"."')}"->>'ne' = :nameNe`,
                { nameNe: dto.name.ne },
              ),
              id: Not(id),
            },
          })
          .then((res) => {
            if (res) errors['name.ne'] = ['Nepali name already in use'];
          }),
      );
    }

    if (checks.length > 0) await Promise.all(checks);

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }

    try {
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
