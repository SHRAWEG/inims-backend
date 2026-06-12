import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisaggregationType } from './entities/disaggregation-type.entity';
import { CreateDisaggregationTypeDto } from './dto/create-disaggregation-type.dto';
import { UpdateDisaggregationTypeDto } from './dto/update-disaggregation-type.dto';
import { DisaggregationTypeResponseDto } from './dto/disaggregation-type-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { QueryDisaggregationTypeDto } from './dto/query-disaggregation-type.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import { ReorderDisaggregationTypesDto } from './dto/reorder-disaggregation-types.dto';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';

@Injectable()
export class DisaggregationTypesService {
  private readonly logger = new Logger(DisaggregationTypesService.name);

  constructor(
    @InjectRepository(DisaggregationType)
    private readonly disaggregationTypeRepository: Repository<DisaggregationType>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateDisaggregationTypeDto,
  ): Promise<DisaggregationTypeResponseDto> {
    try {
      const entity = this.disaggregationTypeRepository.create(dto);
      const saved = await this.disaggregationTypeRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'disaggregation-type',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponseDto(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create disaggregation type', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.handleDbError(error);
    }
  }

  async findAll(query: QueryDisaggregationTypeDto) {
    const qb = this.disaggregationTypeRepository
      .createQueryBuilder('type')
      .where('type.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        "(type.name->>'en' ILIKE :search OR type.name->>'ne' ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('type.sortOrder', 'ASC', 'NULLS LAST')
      .addOrderBy('type.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((item) => this.toResponseDto(item, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findOne(
    id: string,
    locale: SupportedLocale = DEFAULT_LOCALE,
  ): Promise<DisaggregationTypeResponseDto> {
    const entity = await this.disaggregationTypeRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new EntityNotFoundException('DisaggregationType', id);
    }
    return this.toResponseDto(entity, locale);
  }

  async update(
    id: string,
    dto: UpdateDisaggregationTypeDto,
  ): Promise<DisaggregationTypeResponseDto> {
    const existing = await this.disaggregationTypeRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new EntityNotFoundException('DisaggregationType', id);
    }

    try {
      const before = { ...existing };
      const entity = this.disaggregationTypeRepository.merge(existing, dto);
      const saved = await this.disaggregationTypeRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'disaggregation-type',
        resourceId: saved.id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(saved),
      });

      return this.toResponseDto(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to update disaggregation type', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.disaggregationTypeRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new EntityNotFoundException('DisaggregationType', id);
    }

    try {
      await this.disaggregationTypeRepository.softDelete(id);

      await this.auditLogService.log({
        action: AuditAction.SOFT_DELETE,
        resource: 'disaggregation-type',
        resourceId: id,
        before: sanitizeForAudit(existing),
      });
    } catch (error) {
      this.logger.error('Failed to remove disaggregation type', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.handleDbError(error);
    }
  }

  async reorder(dto: ReorderDisaggregationTypesDto): Promise<void> {
    const { orderedIds } = dto;
    if (!orderedIds || orderedIds.length === 0) return;

    try {
      await this.disaggregationTypeRepository.manager.transaction(
        async (transactionalEntityManager) => {
          for (let i = 0; i < orderedIds.length; i++) {
            await transactionalEntityManager.update(
              DisaggregationType,
              orderedIds[i],
              { sortOrder: i },
            );
          }
        },
      );

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'disaggregation-type',
        resourceId: 'bulk-reorder',
        after: { orderedIds },
      });
    } catch (error) {
      this.logger.error('Failed to reorder disaggregation types', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw new BusinessLogicException(
        'Failed to reorder disaggregation types',
      );
    }
  }

  private toResponseDto(
    entity: DisaggregationType,
    locale: SupportedLocale,
  ): DisaggregationTypeResponseDto {
    return {
      id: entity.id,
      name:
        entity.name[locale] ?? (entity.name['en'] || entity.name['ne'] || ''),
      locale,
      isSelective: entity.isSelective,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private handleDbError(error: any): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23505') {
      throw new BusinessLogicException(
        'A DisaggregationType with this name already exists.',
      );
    }
    throw error;
  }
}
