import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MsnpIndicator } from './entities/msnp-indicator.entity';
import { CreateMsnpIndicatorDto } from './dto/create-msnp-indicator.dto';
import { UpdateMsnpIndicatorDto } from './dto/update-msnp-indicator.dto';
import {
  MsnpIndicatorResponseDto,
  MsnpIndicatorDetailResponseDto,
} from './dto/msnp-indicator-response.dto';
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
export class MsnpIndicatorsService {
  private readonly logger = new Logger(MsnpIndicatorsService.name);

  constructor(
    @InjectRepository(MsnpIndicator)
    private readonly msnpIndicatorRepository: Repository<MsnpIndicator>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateMsnpIndicatorDto): Promise<MsnpIndicatorResponseDto> {
    try {
      const entity = this.msnpIndicatorRepository.create({
        code: { en: dto.code.en, ne: dto.code.ne },
        name: { en: dto.name.en, ne: dto.name.ne },
        isActive: dto.isActive ?? true,
      });
      const saved = await this.msnpIndicatorRepository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'msnp-indicator',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create msnp indicator', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(
    query: LocaleQueryDto &
      PaginationQueryDto & { search?: string; isActive?: boolean },
  ) {
    const qb = this.msnpIndicatorRepository
      .createQueryBuilder('indicator')
      .where('indicator.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        `(indicator.name->>'en' ILIKE :search OR indicator.name->>'ne' ILIKE :search OR indicator.code->>'en' ILIKE :search OR indicator.code->>'ne' ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('indicator.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    qb.orderBy(`indicator.name->>'${query.locale}'`, 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((i) => this.toResponse(i, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(
    id: string,
    locale: SupportedLocale,
    withTranslations?: boolean,
  ): Promise<MsnpIndicatorResponseDto | MsnpIndicatorDetailResponseDto> {
    const entity = await this.msnpIndicatorRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new EntityNotFoundException('MsnpIndicator', id);
    }

    if (withTranslations) {
      return {
        id: entity.id,
        code: entity.code,
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
    dto: UpdateMsnpIndicatorDto,
  ): Promise<MsnpIndicatorResponseDto> {
    try {
      const existing = await this.msnpIndicatorRepository.findOneOrFail({
        where: { id },
      });
      const before = { ...existing };

      const updatedCode: LocalizedField = {
        en: dto.code?.en ?? existing.code.en,
        ne: dto.code?.ne ?? existing.code.ne,
      };

      const updatedName: LocalizedField = {
        en: dto.name?.en ?? existing.name.en,
        ne: dto.name?.ne ?? existing.name.ne,
      };

      const updated = await this.msnpIndicatorRepository.save({
        ...existing,
        ...dto,
        code: updatedCode,
        name: updatedName,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'msnp-indicator',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update msnp indicator: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const entity = await this.msnpIndicatorRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new EntityNotFoundException('MsnpIndicator', id);
    }

    await this.msnpIndicatorRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'msnp-indicator',
      resourceId: id,
      before: sanitizeForAudit(entity),
    });
  }

  private toResponse(
    entity: MsnpIndicator,
    locale: SupportedLocale,
  ): MsnpIndicatorResponseDto {
    return {
      id: entity.id,
      code: entity.code[locale] ?? entity.code['en'],
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
