import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Content } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { ContentResponseDto } from './dto/content-response.dto';
import { ContentSummaryResponseDto } from './dto/content-summary-response.dto';
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
export class ContentsService {
  private readonly logger = new Logger(ContentsService.name);

  constructor(
    @InjectRepository(Content)
    private readonly repository: Repository<Content>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateContentDto): Promise<ContentResponseDto> {
    const existingSlug = await this.repository.findOne({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new BusinessValidationException({ slug: ['Slug already in use'] });
    }

    try {
      const entity = this.repository.create({
        title: dto.title,
        slug: dto.slug,
        htmlContent: dto.htmlContent,
      });
      const saved = await this.repository.save(entity);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'content',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved);
    } catch (error) {
      this.logger.error('Failed to create content', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(query: QueryContentDto) {
    const qb = this.repository.createQueryBuilder('content');

    if (query.search) {
      qb.andWhere('(content.slug ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('content.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((c) => this.toSummaryResponse(c, query.locale)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findBySlug(
    slug: string,
    locale?: SupportedLocale,
  ): Promise<ContentResponseDto> {
    const entity = await this.repository.findOne({
      where: { slug },
      relations: ['children'],
    });
    if (!entity) {
      throw new EntityNotFoundException('Content', slug);
    }
    return this.toResponse(entity, locale);
  }

  async update(
    id: string,
    dto: UpdateContentDto,
    locale?: SupportedLocale,
  ): Promise<ContentResponseDto> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('Content', id);
    }

    const errors: Record<string, string[]> = {};
    const checks: Promise<void>[] = [];

    if (dto.slug && dto.slug !== existing.slug) {
      checks.push(
        this.repository
          .findOne({ where: { slug: dto.slug, id: Not(id) } })
          .then((res) => {
            if (res) errors['slug'] = ['Slug already in use'];
          }),
      );
    }

    if (checks.length > 0) await Promise.all(checks);

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }

    try {
      const before = { ...existing };

      const updated = await this.repository.save({
        ...existing,
        ...dto,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'content',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated, locale);
    } catch (error) {
      this.logger.error(`Failed to update content: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new EntityNotFoundException('Content', id);
    }

    await this.repository.delete(id);

    await this.auditLogService.log({
      action: AuditAction.DELETE,
      resource: 'content',
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
    entity: Content,
    locale?: SupportedLocale,
  ): ContentResponseDto {
    return {
      id: entity.id,
      title: this.resolveLocale(entity.title, locale),
      slug: entity.slug,
      htmlContent: this.resolveLocale(entity.htmlContent, locale),
      children: entity.children?.map((child) => ({
        id: child.id,
        title: this.resolveLocale(child.title, locale),
        slug: child.slug,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toSummaryResponse(
    entity: Content,
    locale?: SupportedLocale,
  ): ContentSummaryResponseDto {
    return {
      id: entity.id,
      title: this.resolveLocale(entity.title, locale),
      slug: entity.slug,
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
