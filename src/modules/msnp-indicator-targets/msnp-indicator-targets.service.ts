import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MsnpIndicatorTarget } from './entities/msnp-indicator-target.entity';
import { MsnpIndicatorConfiguration } from '../msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { FiscalYear } from '../fiscal-years/entities/fiscal-year.entity';
import { CreateMsnpIndicatorTargetDto } from './dto/create-msnp-indicator-target.dto';
import { UpdateMsnpIndicatorTargetDto } from './dto/update-msnp-indicator-target.dto';
import { MsnpIndicatorTargetResponseDto } from './dto/msnp-indicator-target-response.dto';
import { BulkUpsertMsnpIndicatorTargetDto } from './dto/bulk-upsert-msnp-indicator-target.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';

@Injectable()
export class MsnpIndicatorTargetsService {
  private readonly logger = new Logger(MsnpIndicatorTargetsService.name);

  constructor(
    @InjectRepository(MsnpIndicatorTarget)
    private readonly targetRepository: Repository<MsnpIndicatorTarget>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateMsnpIndicatorTargetDto,
  ): Promise<MsnpIndicatorTargetResponseDto> {
    try {
      const fiscalYear = await this.targetRepository.manager.findOne(
        FiscalYear,
        { where: { id: dto.fiscalYearId } },
      );
      if (!fiscalYear?.isActive) {
        throw new BusinessLogicException(
          'Data entry is only permitted for the active fiscal year.',
        );
      }
      const config = await this.targetRepository.manager.findOne(
        MsnpIndicatorConfiguration,
        {
          where: { id: dto.indicatorConfigId },
        },
      );
      if (!config)
        throw new EntityNotFoundException(
          'MsnpIndicatorConfiguration',
          dto.indicatorConfigId,
        );

      const target = this.targetRepository.create({
        ...dto,
        indicatorId: config.indicatorId,
      });
      const saved = await this.targetRepository.save(target);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'msnp_indicator_target',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create indicator target', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async bulkUpsert(
    dto: BulkUpsertMsnpIndicatorTargetDto,
  ): Promise<MsnpIndicatorTargetResponseDto[]> {
    const responses: MsnpIndicatorTargetResponseDto[] = [];

    const fiscalYear = await this.targetRepository.manager.findOne(FiscalYear, {
      where: { id: dto.fiscalYearId },
    });
    if (!fiscalYear?.isActive) {
      throw new BusinessLogicException(
        'Data entry is only permitted for the active fiscal year.',
      );
    }

    const configIds = [...new Set(dto.entries.map((e) => e.indicatorConfigId))];
    const configs = await this.targetRepository.manager.find(
      MsnpIndicatorConfiguration,
      {
        where: configIds.map((id) => ({ id })),
      },
    );
    const configMap = new Map(configs.map((c) => [c.id, c.indicatorId]));

    for (const entry of dto.entries) {
      try {
        const indicatorId = configMap.get(entry.indicatorConfigId);
        if (!indicatorId)
          throw new EntityNotFoundException(
            'MsnpIndicatorConfiguration',
            entry.indicatorConfigId,
          );

        const existing = await this.targetRepository.findOne({
          where: {
            fiscalYearId: dto.fiscalYearId,
            indicatorConfigId: entry.indicatorConfigId,
          },
        });

        if (existing) {
          const before = { ...existing };
          existing.targetValue = entry.targetValue;
          if (entry.remarks !== undefined) existing.remarks = entry.remarks;

          const updated = await this.targetRepository.save(existing);

          await this.auditLogService.log({
            action: AuditAction.UPDATE,
            resource: 'msnp_indicator_target',
            resourceId: updated.id,
            before: sanitizeForAudit(before),
            after: sanitizeForAudit(updated),
          });

          responses.push(this.toResponse(updated, DEFAULT_LOCALE));
        } else {
          const newTarget = this.targetRepository.create({
            indicatorConfigId: entry.indicatorConfigId,
            indicatorId,
            fiscalYearId: dto.fiscalYearId,
            targetValue: entry.targetValue,
            remarks: entry.remarks,
          });
          const saved = await this.targetRepository.save(newTarget);

          await this.auditLogService.log({
            action: AuditAction.CREATE,
            resource: 'msnp_indicator_target',
            resourceId: saved.id,
            after: sanitizeForAudit(saved),
          });

          responses.push(this.toResponse(saved, DEFAULT_LOCALE));
        }
      } catch (error) {
        this.logger.error(
          `Failed to bulk upsert indicator target for config ${entry.indicatorConfigId}`,
          { error: (error as Error).message },
        );
        throw error;
      }
    }

    return responses;
  }

  async findAll(
    query: PaginationQueryDto &
      LocaleQueryDto & {
        search?: string;
        indicatorConfigId?: string;
        fiscalYearId?: string;
      },
  ) {
    const qb = this.targetRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.indicatorConfig', 'indicatorConfig')
      .leftJoinAndSelect('indicatorConfig.indicator', 'indicator')
      .where('t.deletedAt IS NULL');

    if (query.indicatorConfigId) {
      qb.andWhere('t.indicatorConfigId = :indicatorConfigId', {
        indicatorConfigId: query.indicatorConfigId,
      });
    }

    if (query.fiscalYearId) {
      qb.andWhere('t.fiscalYearId = :fiscalYearId', {
        fiscalYearId: query.fiscalYearId,
      });
    }

    if (query.search) {
      qb.andWhere('t.remarks ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy('indicator.code', 'ASC')
      .addOrderBy('t.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((t) => this.toResponse(t, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(id: string): Promise<MsnpIndicatorTargetResponseDto> {
    const record = await this.targetRepository.findOne({
      where: { id },
      relations: ['indicatorConfig', 'indicatorConfig.indicator'],
    });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorTarget', id);
    }
    return this.toResponse(record, DEFAULT_LOCALE);
  }

  async update(
    id: string,
    dto: UpdateMsnpIndicatorTargetDto,
  ): Promise<MsnpIndicatorTargetResponseDto> {
    const existing = await this.targetRepository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('MsnpIndicatorTarget', id);
    }

    try {
      const fiscalYear = await this.targetRepository.manager.findOne(
        FiscalYear,
        { where: { id: existing.fiscalYearId } },
      );
      if (!fiscalYear?.isActive) {
        throw new BusinessLogicException(
          'Data entry is only permitted for the active fiscal year.',
        );
      }
      const before = { ...existing };
      const updated = await this.targetRepository.save({
        ...existing,
        ...dto,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'msnp_indicator_target',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update indicator target: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const record = await this.targetRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorTarget', id);
    }

    await this.targetRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'msnp_indicator_target',
      resourceId: id,
      before: sanitizeForAudit(record),
    });
  }

  private toResponse(
    entity: MsnpIndicatorTarget,
    locale: SupportedLocale,
  ): MsnpIndicatorTargetResponseDto {
    let indicatorName = undefined;
    if (entity.indicatorConfig?.indicator?.name) {
      const name = entity.indicatorConfig.indicator.name;
      indicatorName = name[locale] ?? (name['en'] || name['ne'] || '');
    }

    return {
      id: entity.id,
      indicatorConfigId: entity.indicatorConfigId,
      indicatorId: entity.indicatorId,
      indicatorName,
      fiscalYearId: entity.fiscalYearId,
      targetValue: entity.targetValue,
      remarks: entity.remarks,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private handleDbError(error: any): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23505') {
      throw new BusinessLogicException(
        `Target already exists for this configuration and fiscal year`,
      );
    }
    throw error;
  }
}
