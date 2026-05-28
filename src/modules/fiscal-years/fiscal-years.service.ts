import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalYear } from './entities/fiscal-year.entity';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from './dto/update-fiscal-year.dto';
import { FiscalYearResponseDto } from './dto/fiscal-year-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';

@Injectable()
export class FiscalYearsService {
  private readonly logger = new Logger(FiscalYearsService.name);

  constructor(
    @InjectRepository(FiscalYear)
    private readonly fiscalYearRepository: Repository<FiscalYear>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateFiscalYearDto): Promise<FiscalYearResponseDto> {
    try {
      const fiscalYear = this.fiscalYearRepository.create(dto);
      const saved = await this.fiscalYearRepository.save(fiscalYear);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'fiscal_year',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved);
    } catch (error) {
      this.logger.error('Failed to create fiscal year', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(
    query: PaginationQueryDto & { search?: string; isActive?: boolean },
  ) {
    const qb = this.fiscalYearRepository
      .createQueryBuilder('fy')
      .where('fy.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere('fy.year ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('fy.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('fy.year', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((t) => this.toResponse(t)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(id: string): Promise<FiscalYearResponseDto> {
    const record = await this.fiscalYearRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('FiscalYear', id);
    }
    return this.toResponse(record);
  }

  async update(
    id: string,
    dto: UpdateFiscalYearDto,
  ): Promise<FiscalYearResponseDto> {
    const existing = await this.fiscalYearRepository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('FiscalYear', id);
    }

    try {
      const before = { ...existing };
      const updated = await this.fiscalYearRepository.save({
        ...existing,
        ...dto,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'fiscal_year',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated);
    } catch (error) {
      this.logger.error(`Failed to update fiscal year: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const record = await this.fiscalYearRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('FiscalYear', id);
    }

    await this.fiscalYearRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'fiscal_year',
      resourceId: id,
      before: sanitizeForAudit(record),
    });
  }

  private toResponse(entity: FiscalYear): FiscalYearResponseDto {
    return {
      id: entity.id,
      year: entity.year,
      startDateAd: entity.startDateAd,
      endDateAd: entity.endDateAd,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private handleDbError(error: any): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23505') {
      throw new BusinessLogicException(`Duplicate entry: ${err.detail}`);
    }
    throw error;
  }
}
