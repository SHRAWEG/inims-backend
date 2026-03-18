import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gender } from './entities/gender.entity';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import {
  GenderResponseDto,
  GenderDetailResponseDto,
} from './dto/gender-response.dto';
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
export class GendersService {
  private readonly logger = new Logger(GendersService.name);

  constructor(
    @InjectRepository(Gender)
    private readonly genderRepository: Repository<Gender>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateGenderDto): Promise<GenderResponseDto> {
    try {
      const entity = this.genderRepository.create({
        name: { en: dto.name.en, ne: dto.name.ne },
        isActive: dto.isActive ?? true,
      });
      const saved = await this.genderRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'gender',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create gender', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(
    query: LocaleQueryDto &
      PaginationQueryDto & { search?: string; isActive?: boolean },
  ) {
    const qb = this.genderRepository
      .createQueryBuilder('gender')
      .where('gender.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        `(gender.name->>'en' ILIKE :search OR gender.name->>'ne' ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('gender.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy(`gender.name->>'${query.locale}'`, 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((g) => this.toResponse(g, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(
    id: string,
    locale: SupportedLocale,
    withTranslations?: boolean,
  ): Promise<GenderResponseDto | GenderDetailResponseDto> {
    const entity = await this.genderRepository.findOne({ where: { id } });

    if (!entity) {
      throw new EntityNotFoundException('Gender', id);
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

  async update(id: string, dto: UpdateGenderDto): Promise<GenderResponseDto> {
    try {
      const existing = await this.genderRepository.findOneOrFail({
        where: { id },
      });
      const before = { ...existing };

      const updatedName: LocalizedField = {
        en: dto.name?.en ?? existing.name.en,
        ne: dto.name?.ne ?? existing.name.ne,
      };

      const updated = await this.genderRepository.save({
        ...existing,
        ...dto,
        name: updatedName,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'gender',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update gender: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const entity = await this.genderRepository.findOne({ where: { id } });
    if (!entity) {
      throw new EntityNotFoundException('Gender', id);
    }

    await this.genderRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'gender',
      resourceId: id,
      before: sanitizeForAudit(entity),
    });
  }

  private toResponse(
    entity: Gender,
    locale: SupportedLocale,
  ): GenderResponseDto {
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
