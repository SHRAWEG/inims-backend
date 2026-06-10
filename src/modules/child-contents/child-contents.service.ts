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

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'child-content',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.toResponse(saved);
    } catch (error) {
      this.logger.error('Failed to create child content', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    }
  }

  async findAll(query: QueryChildContentDto) {
    const qb = this.repository.createQueryBuilder('childContent');

    qb.where('childContent.parent_id IS NULL');

    if (query.search) {
      qb.andWhere(
        '(childContent.title ILIKE :search OR childContent.slug ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('childContent.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((c) => this.toSummaryResponse(c)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findById(id: string): Promise<ChildContentResponseDto> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new EntityNotFoundException('ChildContent', id);
    }
    return this.toResponse(entity);
  }

  async update(
    id: string,
    dto: UpdateChildContentDto,
  ): Promise<ChildContentResponseDto> {
    const existing = await this.repository.findOne({ where: { id } });
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

      const updated = await this.repository.save({
        ...existing,
        title: dto.title ?? existing.title,
        slug: dto.slug ?? existing.slug,
        htmlContent: dto.htmlContent ?? existing.htmlContent,
        parent,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'child-content',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.toResponse(updated);
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

  private toResponse(entity: ChildContent): ChildContentResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      slug: entity.slug,
      htmlContent: entity.htmlContent,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toSummaryResponse(
    entity: ChildContent,
  ): ChildContentSummaryResponseDto {
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
