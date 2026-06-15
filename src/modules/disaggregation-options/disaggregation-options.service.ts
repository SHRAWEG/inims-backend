import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisaggregationOption } from './entities/disaggregation-option.entity';
import { CreateDisaggregationOptionDto } from './dto/create-disaggregation-option.dto';
import { UpdateDisaggregationOptionDto } from './dto/update-disaggregation-option.dto';
import { DisaggregationOptionResponseDto } from './dto/disaggregation-option-response.dto';
import { QueryDisaggregationOptionDto } from './dto/query-disaggregation-option.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import { ReorderDisaggregationOptionsDto } from './dto/reorder-disaggregation-options.dto';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';

@Injectable()
export class DisaggregationOptionsService {
  private readonly logger = new Logger(DisaggregationOptionsService.name);

  constructor(
    @InjectRepository(DisaggregationOption)
    private readonly disaggregationOptionRepository: Repository<DisaggregationOption>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateDisaggregationOptionDto,
  ): Promise<DisaggregationOptionResponseDto> {
    try {
      const entity = this.disaggregationOptionRepository.create(dto);
      const saved = await this.disaggregationOptionRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'disaggregation-option',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponseDto(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create disaggregation option', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.handleDbError(error);
    }
  }

  async findAll(query: QueryDisaggregationOptionDto) {
    const qb = this.disaggregationOptionRepository
      .createQueryBuilder('option')
      .where('option.deletedAt IS NULL')
      .orderBy('option.sortOrder', 'ASC', 'NULLS LAST')
      .addOrderBy('option.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.disaggregationTypeId) {
      qb.andWhere('option.disaggregation_type_id = :typeId', {
        typeId: query.disaggregationTypeId,
      });
    }

    if (query.search) {
      qb.andWhere(
        "(option.name->>'en' ILIKE :search OR option.name->>'ne' ILIKE :search OR option.code ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((item) => this.toResponseDto(item, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findOne(
    id: string,
    locale: SupportedLocale = DEFAULT_LOCALE,
  ): Promise<DisaggregationOptionResponseDto> {
    const entity = await this.disaggregationOptionRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new EntityNotFoundException('DisaggregationOption', id);
    }
    return this.toResponseDto(entity, locale);
  }

  async update(
    id: string,
    dto: UpdateDisaggregationOptionDto,
  ): Promise<DisaggregationOptionResponseDto> {
    const existing = await this.disaggregationOptionRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new EntityNotFoundException('DisaggregationOption', id);
    }

    try {
      const before = { ...existing };
      const entity = this.disaggregationOptionRepository.merge(existing, dto);
      const saved = await this.disaggregationOptionRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'disaggregation-option',
        resourceId: saved.id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(saved),
      });

      return this.toResponseDto(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to update disaggregation option', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.disaggregationOptionRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new EntityNotFoundException('DisaggregationOption', id);
    }

    try {
      await this.disaggregationOptionRepository.softDelete(id);

      await this.auditLogService.log({
        action: AuditAction.SOFT_DELETE,
        resource: 'disaggregation-option',
        resourceId: id,
        before: sanitizeForAudit(existing),
      });
    } catch (error) {
      this.logger.error('Failed to remove disaggregation option', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.handleDbError(error);
    }
  }

  async reorder(dto: ReorderDisaggregationOptionsDto): Promise<void> {
    const { orderedIds } = dto;
    if (!orderedIds || orderedIds.length === 0) return;

    try {
      await this.disaggregationOptionRepository.manager.transaction(
        async (transactionalEntityManager) => {
          for (let i = 0; i < orderedIds.length; i++) {
            await transactionalEntityManager.update(
              DisaggregationOption,
              orderedIds[i],
              { sortOrder: i },
            );
          }
        },
      );

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'disaggregation-option',
        resourceId: 'bulk-reorder',
        after: { orderedIds },
      });
    } catch (error) {
      this.logger.error('Failed to reorder disaggregation options', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw new BusinessLogicException(
        'Failed to reorder disaggregation options',
      );
    }
  }

  private toResponseDto(
    entity: DisaggregationOption,
    locale: SupportedLocale,
  ): DisaggregationOptionResponseDto {
    return {
      id: entity.id,
      disaggregationTypeId: entity.disaggregationTypeId,
      name:
        entity.name[locale] ?? (entity.name['en'] || entity.name['ne'] || ''),
      locale,
      code: entity.code,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private handleDbError(error: any): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23503') {
      throw new BusinessLogicException(
        'Referenced DisaggregationType does not exist',
      );
    }
    throw error;
  }
}
