import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type as TypeEntity } from './entities/type.entity';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import {
  TypeResponseDto,
  TypeDetailResponseDto,
} from './dto/type-response.dto';
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
export class TypesService {
  private readonly logger = new Logger(TypesService.name);

  constructor(
    @InjectRepository(TypeEntity)
    private readonly typeRepository: Repository<TypeEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateTypeDto): Promise<TypeResponseDto> {
    try {
      const typeRecord = this.typeRepository.create({
        name: { en: dto.name.en, ne: dto.name.ne },
        isActive: dto.isActive ?? true,
      });
      const saved = await this.typeRepository.save(typeRecord);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'type',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create type', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(
    query: LocaleQueryDto &
      PaginationQueryDto & { search?: string; isActive?: boolean },
  ) {
    const qb = this.typeRepository
      .createQueryBuilder('type')
      .where('type.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        `(type.name->>'en' ILIKE :search OR type.name->>'ne' ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('type.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy(`type.name->>'${query.locale}'`, 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((t) => this.toResponse(t, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(
    id: string,
    locale: SupportedLocale,
    withTranslations?: boolean,
  ): Promise<TypeResponseDto | TypeDetailResponseDto> {
    const typeRecord = await this.typeRepository.findOne({ where: { id } });

    if (!typeRecord) {
      throw new EntityNotFoundException('Type', id);
    }

    if (withTranslations) {
      return {
        id: typeRecord.id,
        name: typeRecord.name,
        isActive: typeRecord.isActive,
        createdAt: typeRecord.createdAt,
        updatedAt: typeRecord.updatedAt,
      };
    }

    return this.toResponse(typeRecord, locale);
  }

  async update(id: string, dto: UpdateTypeDto): Promise<TypeResponseDto> {
    try {
      const existing = await this.typeRepository.findOneOrFail({
        where: { id },
      });
      const before = { ...existing };

      const updatedName: LocalizedField = {
        en: dto.name?.en ?? existing.name.en,
        ne: dto.name?.ne ?? existing.name.ne,
      };

      const updated = await this.typeRepository.save({
        ...existing,
        ...dto,
        name: updatedName,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'type',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update type: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const typeRecord = await this.typeRepository.findOne({ where: { id } });
    if (!typeRecord) {
      throw new EntityNotFoundException('Type', id);
    }

    await this.typeRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'type',
      resourceId: id,
      before: sanitizeForAudit(typeRecord),
    });
  }

  private toResponse(
    entity: TypeEntity,
    locale: SupportedLocale,
  ): TypeResponseDto {
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
