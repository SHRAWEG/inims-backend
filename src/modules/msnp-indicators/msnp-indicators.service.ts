import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, Not } from 'typeorm';
import { BusinessValidationException } from '../../common/exceptions/business-validation.exception';
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
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
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
    const errors: Record<string, string[]> = {};

    const [existingCode, existingNameEn, existingNameNe] = await Promise.all([
      this.msnpIndicatorRepository.findOne({ where: { code: dto.code } }),
      this.msnpIndicatorRepository.findOne({
        where: {
          name: Raw(
            (alias) => `"${alias.replace('.', '"."')}"->>'en' = :nameEn`,
            { nameEn: dto.name.en },
          ),
        },
      }),
      this.msnpIndicatorRepository.findOne({
        where: {
          name: Raw(
            (alias) => `"${alias.replace('.', '"."')}"->>'ne' = :nameNe`,
            { nameNe: dto.name.ne },
          ),
        },
      }),
    ]);

    if (existingCode) errors.code = ['Code already in use'];
    if (existingNameEn) errors['name.en'] = ['English name already in use'];
    if (existingNameNe) errors['name.ne'] = ['Nepali name already in use'];

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }

    try {
      const entity = this.msnpIndicatorRepository.create({
        code: dto.code,
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
        `(indicator.name->>'en' ILIKE :search OR indicator.name->>'ne' ILIKE :search OR indicator.code ILIKE :search)`,
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
    const existing = await this.msnpIndicatorRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new EntityNotFoundException('MsnpIndicator', id);
    }

    const errors: Record<string, string[]> = {};
    const checks: Promise<any>[] = [];

    if (dto.code && dto.code !== existing.code) {
      checks.push(
        this.msnpIndicatorRepository
          .findOne({ where: { code: dto.code, id: Not(id) } })
          .then((res) => {
            if (res) errors.code = ['Code already in use'];
          }),
      );
    }

    if (dto.name?.en && dto.name.en !== existing.name.en) {
      checks.push(
        this.msnpIndicatorRepository
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
        this.msnpIndicatorRepository
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

      const updated = await this.msnpIndicatorRepository.save({
        ...existing,
        ...dto,
        code: dto.code ?? existing.code,
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
      code: entity.code,
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
