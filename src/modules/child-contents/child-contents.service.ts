import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';
import { ChildContent } from './entities/child-content.entity';
import { Content } from '../contents/entities/content.entity';
import { CreateChildContentDto } from './dto/create-child-content.dto';
import { UpdateChildContentDto } from './dto/update-child-content.dto';
import { QueryChildContentDto } from './dto/query-child-content.dto';
import { ChildContentResponseDto } from './dto/child-content-response.dto';
import { ChildContentSummaryResponseDto } from './dto/child-content-summary-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessValidationException } from '../../common/exceptions/business-validation.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import {
  LocalizedField,
  SupportedLocale,
  DEFAULT_LOCALE,
} from '../../common/types/i18n.type';

@Injectable()
export class ChildContentsService {
  private readonly logger = new Logger(ChildContentsService.name);

  constructor(
    @InjectRepository(ChildContent)
    private readonly repository: Repository<ChildContent>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateChildContentDto): Promise<ChildContentResponseDto> {
    const errors: Record<string, string[]> = {};

    let parent: Content | undefined;
    if (dto.parent) {
      if (!isUUID(dto.parent)) {
        errors['parent'] = ['Parent must be a valid UUID'];
      } else {
        const content = await this.contentRepository.findOne({
          where: { id: dto.parent },
        });
        if (!content) {
          errors['parent'] = ['Parent content not found'];
        } else {
          parent = content;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }

    try {
      const entity = this.repository.create({
        title: dto.title,
        slug: dto.slug,
        htmlContent: dto.htmlContent,
        parent,
      });
      const saved = await this.repository.save(entity);
      const loaded = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['parent'],
      });

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'child-content',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(loaded!);
    } catch (error) {
      this.logger.error('Failed to create child content', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(query: QueryChildContentDto) {
    const qb = this.repository.createQueryBuilder('childContent');

    qb.leftJoinAndSelect('childContent.parent', 'parent');

    if (query.search) {
      qb.andWhere('(childContent.slug ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('childContent.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((c) => this.toSummaryResponse(c, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(
    id: string,
    locale?: SupportedLocale,
  ): Promise<ChildContentResponseDto> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!entity) {
      throw new EntityNotFoundException('ChildContent', id);
    }
    return this.toResponse(entity, locale);
  }

  async update(
    id: string,
    dto: UpdateChildContentDto,
    locale?: SupportedLocale,
  ): Promise<ChildContentResponseDto> {
    const existing = await this.repository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!existing) {
      throw new EntityNotFoundException('ChildContent', id);
    }

    const errors: Record<string, string[]> = {};

    let parent: Content | undefined = existing.parent;
    if (dto.parent !== undefined) {
      if (!dto.parent) {
        parent = undefined;
      } else if (!isUUID(dto.parent)) {
        errors['parent'] = ['Parent must be a valid UUID'];
      } else {
        const content = await this.contentRepository.findOne({
          where: { id: dto.parent },
        });
        if (!content) {
          errors['parent'] = ['Parent content not found'];
        } else {
          parent = content;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }

    try {
      const before = { ...existing };

      await this.repository.save({
        ...existing,
        title: dto.title ?? existing.title,
        slug: dto.slug ?? existing.slug,
        htmlContent: dto.htmlContent ?? existing.htmlContent,
        parent,
      });

      const updated = await this.repository.findOne({
        where: { id },
        relations: ['parent'],
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'child-content',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated!, locale);
    } catch (error) {
      this.logger.error(`Failed to update child content: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new EntityNotFoundException('ChildContent', id);
    }

    await this.repository.delete(id);

    await this.auditLogService.log({
      action: AuditAction.DELETE,
      resource: 'child-content',
      resourceId: id,
      before: sanitizeForAudit(entity),
    });
  }

  private resolveLocale(
    field: LocalizedField,
    locale?: SupportedLocale,
  ): string {
    const lang = locale ?? DEFAULT_LOCALE;
    return field[lang] ?? field[DEFAULT_LOCALE] ?? '';
  }

  private toResponse(
    entity: ChildContent,
    locale?: SupportedLocale,
  ): ChildContentResponseDto {
    return {
      id: entity.id,
      title: this.resolveLocale(entity.title, locale),
      slug: entity.slug,
      htmlContent: this.resolveLocale(entity.htmlContent, locale),
      parent: entity.parent
        ? {
            id: entity.parent.id,
            title: this.resolveLocale(entity.parent.title, locale),
            slug: entity.parent.slug,
          }
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toSummaryResponse(
    entity: ChildContent,
    locale?: SupportedLocale,
  ): ChildContentSummaryResponseDto {
    return {
      id: entity.id,
      title: this.resolveLocale(entity.title, locale),
      slug: entity.slug,
      parent: entity.parent
        ? {
            id: entity.parent.id,
            title: this.resolveLocale(entity.parent.title, locale),
            slug: entity.parent.slug,
          }
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private handleDbError(error: unknown): never {
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
