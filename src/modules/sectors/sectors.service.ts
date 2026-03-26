import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, Not } from 'typeorm';
import { BusinessValidationException } from '../../common/exceptions/business-validation.exception';
import { Sector } from './entities/sector.entity';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import {
  SectorResponseDto,
  SectorDetailResponseDto,
} from './dto/sector-response.dto';
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
export class SectorsService {
  private readonly logger = new Logger(SectorsService.name);

  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateSectorDto): Promise<SectorResponseDto> {
    const errors: Record<string, string[]> = {};

    const [existingEn, existingNe] = await Promise.all([
      this.sectorRepository.findOne({
        where: {
          name: Raw(
            (alias) => `"${alias.replace('.', '"."')}"->>'en' = :nameEn`,
            {
              nameEn: dto.name.en,
            },
          ),
        },
      }),
      this.sectorRepository.findOne({
        where: {
          name: Raw(
            (alias) => `"${alias.replace('.', '"."')}"->>'ne' = :nameNe`,
            {
              nameNe: dto.name.ne,
            },
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
      const sector = this.sectorRepository.create({
        name: { en: dto.name.en, ne: dto.name.ne },
        isActive: dto.isActive ?? true,
      });
      const saved = await this.sectorRepository.save(sector);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'sector',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create sector', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(
    query: LocaleQueryDto &
      PaginationQueryDto & { search?: string; isActive?: boolean },
  ) {
    const qb = this.sectorRepository
      .createQueryBuilder('sector')
      .where('sector.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        `(sector.name->>'en' ILIKE :search OR sector.name->>'ne' ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('sector.isActive = :isActive', { isActive: query.isActive });
    }

    // Sort by name in requested locale
    qb.orderBy(`sector.name->>'${query.locale}'`, 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((s) => this.toResponse(s, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(
    id: string,
    locale: SupportedLocale,
    withTranslations?: boolean,
  ): Promise<SectorResponseDto | SectorDetailResponseDto> {
    const sector = await this.sectorRepository.findOne({ where: { id } });

    if (!sector) {
      throw new EntityNotFoundException('Sector', id);
    }

    if (withTranslations) {
      return {
        id: sector.id,
        name: sector.name,
        isActive: sector.isActive,
        createdAt: sector.createdAt,
        updatedAt: sector.updatedAt,
      };
    }

    return this.toResponse(sector, locale);
  }

  async update(id: string, dto: UpdateSectorDto): Promise<SectorResponseDto> {
    const existing = await this.sectorRepository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('Sector', id);
    }

    const errors: Record<string, string[]> = {};
    const checks: Promise<any>[] = [];

    if (dto.name?.en && dto.name.en !== existing.name.en) {
      checks.push(
        this.sectorRepository
          .findOne({
            where: {
              name: Raw(
                (alias) => `"${alias.replace('.', '"."')}"->>'en' = :nameEn`,
                {
                  nameEn: dto.name.en,
                },
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
        this.sectorRepository
          .findOne({
            where: {
              name: Raw(
                (alias) => `"${alias.replace('.', '"."')}"->>'ne' = :nameNe`,
                {
                  nameNe: dto.name.ne,
                },
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

      // Merge JSONB field — if only one locale sent, preserve the other
      const updatedName: LocalizedField = {
        en: dto.name?.en ?? existing.name.en,
        ne: dto.name?.ne ?? existing.name.ne,
      };

      const updated = await this.sectorRepository.save({
        ...existing,
        ...dto,
        name: updatedName,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'sector',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update sector: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) {
      throw new EntityNotFoundException('Sector', id);
    }

    await this.sectorRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'sector',
      resourceId: id,
      before: sanitizeForAudit(sector),
    });
  }

  private toResponse(
    entity: Sector,
    locale: SupportedLocale,
  ): SectorResponseDto {
    return {
      id: entity.id,
      name: entity.name[locale] ?? entity.name['en'], // fallback to en
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
