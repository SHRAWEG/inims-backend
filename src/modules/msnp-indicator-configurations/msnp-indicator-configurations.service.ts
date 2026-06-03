import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MsnpIndicatorConfiguration } from './entities/msnp-indicator-configuration.entity';
import { MsnpIndicatorDisaggregation } from './entities/msnp-indicator-disaggregation.entity';
import { MsnpIndicatorDisaggregationOption } from './entities/msnp-indicator-disaggregation-option.entity';
import { DisaggregationType } from '../disaggregation-types/entities/disaggregation-type.entity';
import { CreateMsnpIndicatorConfigurationDto } from './dto/create-msnp-indicator-configuration.dto';
import { UpdateMsnpIndicatorConfigurationDto } from './dto/update-msnp-indicator-configuration.dto';
import { MsnpIndicatorConfigurationResponseDto } from './dto/msnp-indicator-configuration-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessValidationException } from '../../common/exceptions/business-validation.exception';
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
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateMsnpIndicatorConfigurationDto,
  ): Promise<MsnpIndicatorConfigurationResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const config = queryRunner.manager.create(MsnpIndicatorConfiguration, {
        indicatorId: dto.indicatorId,
        sectorId: dto.sectorId,
        typeId: dto.typeId,
        roleId: dto.roleId,
        unit: dto.unit,
        isActive: dto.isActive,
      });

      const saved = await queryRunner.manager.save(config);

      if (dto.disaggregations && dto.disaggregations.length > 0) {
        for (let i = 0; i < dto.disaggregations.length; i++) {
          const item = dto.disaggregations[i];
          const dtype = await queryRunner.manager.findOne(DisaggregationType, {
            where: { id: item.disaggregationTypeId },
          });

          if (!dtype) {
            throw new BusinessValidationException({
              [`disaggregations.${i}.disaggregationTypeId`]: [
                'Disaggregation type not found',
              ],
            });
          }

          if (
            item.optionIds &&
            item.optionIds.length > 0 &&
            !dtype.isSelective
          ) {
            throw new BusinessValidationException({
              [`disaggregations.${i}.optionIds`]: [
                'Cannot provide specific options for a non-selective disaggregation type',
              ],
            });
          }

          const disag = queryRunner.manager.create(
            MsnpIndicatorDisaggregation,
            {
              configurationId: saved.id,
              disaggregationTypeId: item.disaggregationTypeId,
            },
          );

          const savedDisag = await queryRunner.manager.save(disag);

          if (
            dtype.isSelective &&
            item.optionIds &&
            item.optionIds.length > 0
          ) {
            const optionsToSave = item.optionIds.map((optId) =>
              queryRunner.manager.create(MsnpIndicatorDisaggregationOption, {
                indicatorDisaggregationId: savedDisag.id,
                disaggregationOptionId: optId,
              }),
            );
            await queryRunner.manager.save(optionsToSave);
          }
        }
      }

      await queryRunner.commitTransaction();

      // Fetch the full record with relations for audit and response
      const fullSaved = await this.findById(saved.id, DEFAULT_LOCALE);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'msnp_indicator_configuration',
        resourceId: saved.id,
        after: sanitizeForAudit(fullSaved),
      });

      return fullSaved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create config', {
        error: (error as Error).message,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryMsnpIndicatorConfigurationDto) {
    const qb = this.configRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.indicator', 'indicator')
      .leftJoinAndSelect('c.sector', 'sector')
      .leftJoinAndSelect('c.type', 'type')
      .leftJoinAndSelect('c.role', 'role')
      .leftJoinAndSelect('c.disaggregations', 'disagg')
      .leftJoinAndSelect('disagg.disaggregationType', 'dtype')
      .leftJoinAndSelect('disagg.options', 'dopts')
      .leftJoinAndSelect('dopts.disaggregationOption', 'dopt')
      .where('c.deletedAt IS NULL');

    if (query.indicatorId) {
      qb.andWhere('c.indicatorId = :indicatorId', {
        indicatorId: query.indicatorId,
      });
    }

    if (query.roleId) {
      qb.andWhere('c.roleId = :roleId', {
        roleId: query.roleId,
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
      relations: [
        'indicator',
        'sector',
        'type',
        'role',
        'disaggregations',
        'disaggregations.disaggregationType',
        'disaggregations.options',
        'disaggregations.options.disaggregationOption',
      ],
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const before = { ...existing };

      const configUpdate = {
        indicatorId: dto.indicatorId ?? existing.indicatorId,
        sectorId: dto.sectorId !== undefined ? dto.sectorId : existing.sectorId,
        typeId: dto.typeId !== undefined ? dto.typeId : existing.typeId,
        roleId: dto.roleId !== undefined ? dto.roleId : existing.roleId,
        unit: dto.unit !== undefined ? dto.unit : existing.unit,
        isActive: dto.isActive ?? existing.isActive,
      };

      await queryRunner.manager.update(
        MsnpIndicatorConfiguration,
        id,
        configUpdate,
      );

      if (dto.disaggregations) {
        // Find existing disaggregations to remove them
        const existingDisags = await queryRunner.manager.find(
          MsnpIndicatorDisaggregation,
          {
            where: { configurationId: id },
          },
        );

        if (existingDisags.length > 0) {
          await queryRunner.manager.softRemove(existingDisags);
        }

        // Recreate them
        for (let i = 0; i < dto.disaggregations.length; i++) {
          const item = dto.disaggregations[i];
          const dtype = await queryRunner.manager.findOne(DisaggregationType, {
            where: { id: item.disaggregationTypeId },
          });

          if (!dtype) {
            throw new BusinessValidationException({
              [`disaggregations.${i}.disaggregationTypeId`]: [
                'Disaggregation type not found',
              ],
            });
          }

          if (
            item.optionIds &&
            item.optionIds.length > 0 &&
            !dtype.isSelective
          ) {
            throw new BusinessValidationException({
              [`disaggregations.${i}.optionIds`]: [
                'Cannot provide specific options for a non-selective disaggregation type',
              ],
            });
          }

          const disag = queryRunner.manager.create(
            MsnpIndicatorDisaggregation,
            {
              configurationId: id,
              disaggregationTypeId: item.disaggregationTypeId,
            },
          );

          const savedDisag = await queryRunner.manager.save(disag);

          if (
            dtype.isSelective &&
            item.optionIds &&
            item.optionIds.length > 0
          ) {
            const optionsToSave = item.optionIds.map((optId) =>
              queryRunner.manager.create(MsnpIndicatorDisaggregationOption, {
                indicatorDisaggregationId: savedDisag.id,
                disaggregationOptionId: optId,
              }),
            );
            await queryRunner.manager.save(optionsToSave);
          }
        }
      }

      await queryRunner.commitTransaction();

      const fullUpdated = await this.findById(id, DEFAULT_LOCALE);

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'msnp_indicator_configuration',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(fullUpdated),
      });

      return fullUpdated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update config: ${id}`, {
        error: (error as Error).message,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const record = await this.configRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorConfiguration', id);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingDisags = await queryRunner.manager.find(
        MsnpIndicatorDisaggregation,
        {
          where: { configurationId: id },
        },
      );
      if (existingDisags.length > 0) {
        await queryRunner.manager.softRemove(existingDisags);
      }
      await queryRunner.manager.softDelete(MsnpIndicatorConfiguration, id);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.SOFT_DELETE,
        resource: 'msnp_indicator_configuration',
        resourceId: id,
        before: sanitizeForAudit(record),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
      unit: entity.unit,
      isActive: entity.isActive,
      locale,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      disaggregations: entity.disaggregations?.map((d) => ({
        disaggregationTypeId: d.disaggregationTypeId,
        disaggregationTypeName: resolveName(d.disaggregationType?.name),
        optionIds: d.options?.map((o) => o.disaggregationOptionId),
      })),
    };
  }
}
