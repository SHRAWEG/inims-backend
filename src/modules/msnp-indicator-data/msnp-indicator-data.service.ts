import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MsnpIndicatorData } from './entities/msnp-indicator-data.entity';
import { CreateMsnpIndicatorDataDto } from './dto/create-msnp-indicator-data.dto';
import { UpdateMsnpIndicatorDataDto } from './dto/update-msnp-indicator-data.dto';
import { MsnpIndicatorDataResponseDto } from './dto/msnp-indicator-data-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { BulkUpsertMsnpIndicatorDataDto } from './dto/bulk-upsert-msnp-indicator-data.dto';

@Injectable()
export class MsnpIndicatorDataService {
  private readonly logger = new Logger(MsnpIndicatorDataService.name);

  constructor(
    @InjectRepository(MsnpIndicatorData)
    private readonly dataRepository: Repository<MsnpIndicatorData>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateMsnpIndicatorDataDto,
    userId: string,
  ): Promise<MsnpIndicatorDataResponseDto> {
    try {
      const data = this.dataRepository.create({
        ...dto,
        submittedBy: userId,
      });
      const saved = await this.dataRepository.save(data);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'msnp_indicator_data',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved);
    } catch (error) {
      this.logger.error('Failed to create indicator data', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async bulkUpsert(
    dto: BulkUpsertMsnpIndicatorDataDto,
    userId: string,
  ): Promise<MsnpIndicatorDataResponseDto[]> {
    const responses: MsnpIndicatorDataResponseDto[] = [];

    for (const entry of dto.entries) {
      try {
        const existing = await this.dataRepository.findOne({
          where: {
            fiscalYearId: dto.fiscalYearId,
            indicatorConfigId: entry.indicatorConfigId,
          },
        });

        if (existing) {
          const before = { ...existing };
          existing.value = entry.value;
          if (entry.dataSource !== undefined)
            existing.dataSource = entry.dataSource;
          if (entry.remarks !== undefined) existing.remarks = entry.remarks;
          existing.submittedBy = userId;

          const updated = await this.dataRepository.save(existing);

          await this.auditLogService.log({
            action: AuditAction.UPDATE,
            resource: 'msnp_indicator_data',
            resourceId: updated.id,
            before: sanitizeForAudit(before),
            after: sanitizeForAudit(updated),
          });

          responses.push(this.toResponse(updated));
        } else {
          const newData = this.dataRepository.create({
            indicatorConfigId: entry.indicatorConfigId,
            fiscalYearId: dto.fiscalYearId,
            value: entry.value,
            dataSource: entry.dataSource,
            remarks: entry.remarks,
            submittedBy: userId,
          });
          const saved = await this.dataRepository.save(newData);

          await this.auditLogService.log({
            action: AuditAction.CREATE,
            resource: 'msnp_indicator_data',
            resourceId: saved.id,
            after: sanitizeForAudit(saved),
          });

          responses.push(this.toResponse(saved));
        }
      } catch (error) {
        this.logger.error(
          `Failed to bulk upsert indicator data for config ${entry.indicatorConfigId}`,
          { error: (error as Error).message },
        );
        throw error;
      }
    }

    return responses;
  }

  async findAll(
    query: PaginationQueryDto & {
      search?: string;
      indicatorConfigId?: string;
      fiscalYearId?: string;
    },
  ) {
    const qb = this.dataRepository
      .createQueryBuilder('d')
      .where('d.deletedAt IS NULL');

    if (query.indicatorConfigId) {
      qb.andWhere('d.indicatorConfigId = :indicatorConfigId', {
        indicatorConfigId: query.indicatorConfigId,
      });
    }

    if (query.fiscalYearId) {
      qb.andWhere('d.fiscalYearId = :fiscalYearId', {
        fiscalYearId: query.fiscalYearId,
      });
    }

    if (query.search) {
      qb.andWhere('(d.remarks ILIKE :search OR d.dataSource ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('d.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((t) => this.toResponse(t)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(id: string): Promise<MsnpIndicatorDataResponseDto> {
    const record = await this.dataRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorData', id);
    }
    return this.toResponse(record);
  }

  async update(
    id: string,
    dto: UpdateMsnpIndicatorDataDto,
  ): Promise<MsnpIndicatorDataResponseDto> {
    const existing = await this.dataRepository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('MsnpIndicatorData', id);
    }

    try {
      const before = { ...existing };
      const updated = await this.dataRepository.save({
        ...existing,
        ...dto,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'msnp_indicator_data',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated);
    } catch (error) {
      this.logger.error(`Failed to update indicator data: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const record = await this.dataRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorData', id);
    }

    await this.dataRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'msnp_indicator_data',
      resourceId: id,
      before: sanitizeForAudit(record),
    });
  }

  private toResponse(entity: MsnpIndicatorData): MsnpIndicatorDataResponseDto {
    return {
      id: entity.id,
      indicatorConfigId: entity.indicatorConfigId,
      fiscalYearId: entity.fiscalYearId,
      value: entity.value,
      dataSource: entity.dataSource,
      remarks: entity.remarks,
      submittedBy: entity.submittedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private handleDbError(error: any): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23505') {
      throw new BusinessLogicException(
        `Data already exists for this configuration and fiscal year`,
      );
    }
    throw error;
  }
}
