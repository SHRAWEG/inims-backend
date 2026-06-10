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

@Injectable()
export class ContentsService {
  private readonly logger = new Logger(ContentsService.name);

  constructor(
    @InjectRepository(Content)
    private readonly repository: Repository<Content>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateContentDto): Promise<ContentResponseDto> {
    const errors: Record<string, string[]> = {};

    const [existingTitle, existingSlug] = await Promise.all([
      this.repository.findOne({ where: { title: dto.title } }),
      this.repository.findOne({ where: { slug: dto.slug } }),
    ]);

    if (existingTitle) errors['title'] = ['Title already in use'];
    if (existingSlug) errors['slug'] = ['Slug already in use'];

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
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
      qb.andWhere(
        '(content.title ILIKE :search OR content.slug ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('content.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((c) => this.toSummaryResponse(c)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findBySlug(slug: string): Promise<ContentResponseDto> {
    const entity = await this.repository.findOne({
      where: { slug },
    });
    if (!entity) {
      throw new EntityNotFoundException('Content', slug);
    }
    return this.toResponse(entity);
  }

  async update(id: string, dto: UpdateContentDto): Promise<ContentResponseDto> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('Content', id);
    }

    const errors: Record<string, string[]> = {};
    const checks: Promise<void>[] = [];

    if (dto.title && dto.title !== existing.title) {
      checks.push(
        this.repository
          .findOne({ where: { title: dto.title, id: Not(id) } })
          .then((res) => {
            if (res) errors['title'] = ['Title already in use'];
          }),
      );
    }

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

      return this.toResponse(updated);
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

  private toResponse(entity: Content): ContentResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      slug: entity.slug,
      htmlContent: entity.htmlContent,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toSummaryResponse(entity: Content): ContentSummaryResponseDto {
    return {
      id: entity.id,
      title: entity.title,
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
