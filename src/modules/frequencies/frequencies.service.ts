import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frequency } from './entities/frequency.entity';
import { CreateFrequencyDto } from './dto/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/update-frequency.dto';
import {
  FrequencyResponseDto,
  FrequencyDetailResponseDto,
} from './dto/frequency-response.dto';
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
export class FrequenciesService {
  private readonly logger = new Logger(FrequenciesService.name);

  constructor(
    @InjectRepository(Frequency)
    private readonly frequencyRepository: Repository<Frequency>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateFrequencyDto): Promise<FrequencyResponseDto> {
    try {
      const entity = this.frequencyRepository.create({
        name: { en: dto.name.en, ne: dto.name.ne },
        isActive: dto.isActive ?? true,
      });
      const saved = await this.frequencyRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'frequency',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create frequency', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(
    query: LocaleQueryDto &
      PaginationQueryDto & { search?: string; isActive?: boolean },
  ) {
    const qb = this.frequencyRepository
      .createQueryBuilder('frequency')
      .where('frequency.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        `(frequency.name->>'en' ILIKE :search OR frequency.name->>'ne' ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('frequency.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    qb.orderBy(`frequency.name->>'${query.locale}'`, 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((f) => this.toResponse(f, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(
    id: string,
    locale: SupportedLocale,
    withTranslations?: boolean,
  ): Promise<FrequencyResponseDto | FrequencyDetailResponseDto> {
    const entity = await this.frequencyRepository.findOne({ where: { id } });

    if (!entity) {
      throw new EntityNotFoundException('Frequency', id);
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
    dto: UpdateFrequencyDto,
  ): Promise<FrequencyResponseDto> {
    try {
      const existing = await this.frequencyRepository.findOneOrFail({
        where: { id },
      });
      const before = { ...existing };

      const updatedName: LocalizedField = {
        en: dto.name?.en ?? existing.name.en,
        ne: dto.name?.ne ?? existing.name.ne,
      };

      const updated = await this.frequencyRepository.save({
        ...existing,
        ...dto,
        name: updatedName,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'frequency',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update frequency: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const entity = await this.frequencyRepository.findOne({ where: { id } });
    if (!entity) {
      throw new EntityNotFoundException('Frequency', id);
    }

    await this.frequencyRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'frequency',
      resourceId: id,
      before: sanitizeForAudit(entity),
    });
  }

  private toResponse(
    entity: Frequency,
    locale: SupportedLocale,
  ): FrequencyResponseDto {
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
