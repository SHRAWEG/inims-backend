import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MsnpIndicatorConfiguration } from './entities/msnp-indicator-configuration.entity';
import { CreateMsnpIndicatorConfigurationDto } from './dto/create-msnp-indicator-configuration.dto';
import { UpdateMsnpIndicatorConfigurationDto } from './dto/update-msnp-indicator-configuration.dto';
import { MsnpIndicatorConfigurationResponseDto } from './dto/msnp-indicator-configuration-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import { QueryMsnpIndicatorConfigurationDto } from './dto/query-msnp-indicator-configuration.dto';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';

@Injectable()
export class MsnpIndicatorConfigurationsService {
  private readonly logger = new Logger(MsnpIndicatorConfigurationsService.name);

  constructor(
    @InjectRepository(MsnpIndicatorConfiguration)
    private readonly configRepository: Repository<MsnpIndicatorConfiguration>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateMsnpIndicatorConfigurationDto,
  ): Promise<MsnpIndicatorConfigurationResponseDto> {
    try {
      const config = this.configRepository.create(dto);
      const saved = await this.configRepository.save(config);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'msnp_indicator_configuration',
        resourceId: saved.id,
        after: sanitizeForAudit(saved),
      });

      return this.findById(saved.id, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error('Failed to create config', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async findAll(query: QueryMsnpIndicatorConfigurationDto) {
    const qb = this.configRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.indicator', 'indicator')
      .leftJoinAndSelect('c.sector', 'sector')
      .leftJoinAndSelect('c.type', 'type')
      .leftJoinAndSelect('c.role', 'role')
      .where('c.deletedAt IS NULL');

    if (query.indicatorId) {
      qb.andWhere('c.indicatorId = :indicatorId', {
        indicatorId: query.indicatorId,
      });
    }

    if (query.search) {
      qb.andWhere(
        "(indicator.name->>'en' ILIKE :search OR indicator.name->>'ne' ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('c.createdAt', 'DESC')
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
    locale: SupportedLocale = DEFAULT_LOCALE,
  ): Promise<MsnpIndicatorConfigurationResponseDto> {
    const record = await this.configRepository.findOne({
      where: { id },
      relations: ['indicator', 'sector', 'type', 'role'],
    });

    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorConfiguration', id);
    }
    return this.toResponse(record, locale);
  }

  async update(
    id: string,
    dto: UpdateMsnpIndicatorConfigurationDto,
  ): Promise<MsnpIndicatorConfigurationResponseDto> {
    const existing = await this.configRepository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('MsnpIndicatorConfiguration', id);
    }

    try {
      const before = { ...existing };
      const updated = await this.configRepository.save({
        ...existing,
        ...dto,
      });

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'msnp_indicator_configuration',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(updated),
      });

      return this.findById(updated.id, DEFAULT_LOCALE);
    } catch (error) {
      this.logger.error(`Failed to update config: ${id}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const record = await this.configRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorConfiguration', id);
    }

    await this.configRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'msnp_indicator_configuration',
      resourceId: id,
      before: sanitizeForAudit(record),
    });
  }

  private toResponse(
    entity: MsnpIndicatorConfiguration,
    locale: SupportedLocale,
  ): MsnpIndicatorConfigurationResponseDto {
    const resolveName = (field: unknown) => {
      if (!field) return '';
      const f = field as Record<string, string>;
      return f[locale] ?? (f['en'] || f['ne'] || '');
    };

    return {
      id: entity.id,
      indicatorId: entity.indicatorId,
      indicatorName: resolveName(entity.indicator?.name),
      sectorId: entity.sectorId,
      sectorName: resolveName(entity.sector?.name),
      typeId: entity.typeId,
      typeName: resolveName(entity.type?.name),
      roleId: entity.roleId,
      roleName: resolveName(entity.role?.name),
      isActive: entity.isActive,
      locale,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
