import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  FindOptionsWhere,
  FindOptionsOrder,
} from 'typeorm';
import { ClsService } from 'nestjs-cls';
import diff from 'microdiff';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { AuditAction } from '../../common/enums/audit-action.enum';

export interface AuditLogInput {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  userId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'hashedRefreshToken',
  'accessToken',
  'refreshToken',
  'secret',
  'token',
];

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly cls: ClsService,
  ) {}

  /**
   * Log an audit event. This method NEVER throws — if audit logging
   * fails, it logs the error and returns silently.
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      const userId = input.userId ?? this.cls.get<string>('userId') ?? null;
      const ipAddress = this.cls.get<string>('ipAddress') ?? null;
      const userAgent = this.cls.get<string>('userAgent') ?? null;

      // Sanitize snapshots — remove sensitive fields
      const before = input.before ? this.sanitize(input.before) : null;
      const after = input.after ? this.sanitize(input.after) : null;

      // Compute diff for UPDATE actions
      let diffResult: Record<string, any>[] | null = null;
      if (input.action === AuditAction.UPDATE && before && after) {
        diffResult = diff(before, after) as Record<string, any>[];
      }

      const auditLog = this.auditLogRepository.create({
        userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        before,
        after,
        diff: diffResult,
        metadata: input.metadata ?? null,
        ipAddress,
        userAgent,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error('Failed to write audit log', {
        error: errorMessage,
        stack: errorStack,
        input: {
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
        },
      });
    }
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(
    query: AuditLogQueryDto,
  ): Promise<{ items: AuditLog[]; total: number }> {
    const { userId, action, resource, resourceId, startDate, endDate } = query;
    const { limit, offset, sortBy, sortOrder } =
      PaginationUtil.getPaginationOptions(query);

    const where: FindOptionsWhere<AuditLog> = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const [items, total] = await this.auditLogRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { [sortBy]: sortOrder } as FindOptionsOrder<AuditLog>,
    });

    return { items, total };
  }

  /**
   * Find a single audit log entry
   */
  async findOne(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({
      where: { id } as FindOptionsWhere<AuditLog>,
    });
    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  /**
   * Strip sensitive fields from the snapshot.
   */
  private sanitize(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
