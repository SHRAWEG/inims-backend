import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, In } from 'typeorm';
import { MsnpIndicatorData } from './entities/msnp-indicator-data.entity';
import { MsnpIndicatorDisaggregationData } from './entities/msnp-indicator-disaggregation-data.entity';
import { MsnpIndicatorConfiguration } from '../msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { FiscalYear } from '../fiscal-years/entities/fiscal-year.entity';
import {
  CreateMsnpIndicatorDataDto,
  DisaggregationDataInputDto,
} from './dto/create-msnp-indicator-data.dto';
import { UpdateMsnpIndicatorDataDto } from './dto/update-msnp-indicator-data.dto';
import { MsnpIndicatorDataResponseDto } from './dto/msnp-indicator-data-response.dto';
import { DataEntryFormResponseDto } from './dto/data-entry-form-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { BusinessValidationException } from '../../common/exceptions/business-validation.exception';
import { SupportedLocale, DEFAULT_LOCALE } from '../../common/types/i18n.type';
import { sanitizeForAudit } from '../../common/utils/audit.util';
import { BulkUpsertMsnpIndicatorDataDto } from './dto/bulk-upsert-msnp-indicator-data.dto';

@Injectable()
export class MsnpIndicatorDataService {
  private readonly logger = new Logger(MsnpIndicatorDataService.name);

  constructor(
    @InjectRepository(MsnpIndicatorData)
    private readonly dataRepository: Repository<MsnpIndicatorData>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  private async validateDisaggregationPayload(
    queryRunner: QueryRunner,
    configId: string,
    disaggregations?: DisaggregationDataInputDto[],
    prefix = 'disaggregations',
  ): Promise<void> {
    if (!disaggregations || disaggregations.length === 0) return;

    const seenOptions = new Set<string>();
    const errors: Record<string, string[]> = {};

    for (let i = 0; i < disaggregations.length; i++) {
      const optId = disaggregations[i].disaggregationOptionId;
      if (seenOptions.has(optId)) {
        errors[`${prefix}.${i}.disaggregationOptionId`] = [
          'Duplicate disaggregation option ID',
        ];
      }
      seenOptions.add(optId);
    }

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }

    const config = await queryRunner.manager.findOne(
      MsnpIndicatorConfiguration,
      {
        where: { id: configId },
        relations: [
          'disaggregations',
          'disaggregations.disaggregationType',
          'disaggregations.disaggregationType.options',
          'disaggregations.options',
        ],
      },
    );

    if (!config) {
      throw new EntityNotFoundException('MsnpIndicatorConfiguration', configId);
    }

    const validOptionIds = new Set<string>();
    if (config.disaggregations) {
      for (const disagg of config.disaggregations) {
        if (disagg.disaggregationType?.isSelective) {
          for (const opt of disagg.options || []) {
            validOptionIds.add(opt.disaggregationOptionId);
          }
        } else {
          for (const opt of disagg.disaggregationType?.options || []) {
            validOptionIds.add(opt.id);
          }
        }
      }
    }

    for (let i = 0; i < disaggregations.length; i++) {
      if (!validOptionIds.has(disaggregations[i].disaggregationOptionId)) {
        errors[`${prefix}.${i}.disaggregationOptionId`] = [
          'Invalid option ID. It does not belong to the applied disaggregations for this configuration.',
        ];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BusinessValidationException(errors);
    }
  }

  async create(
    dto: CreateMsnpIndicatorDataDto,
    userId: string,
  ): Promise<MsnpIndicatorDataResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fiscalYear = await queryRunner.manager.findOne(FiscalYear, {
        where: { id: dto.fiscalYearId },
      });
      if (!fiscalYear?.isActive) {
        throw new BusinessLogicException(
          'Data entry is only permitted for the active fiscal year.',
        );
      }
      const config = await queryRunner.manager.findOne(
        MsnpIndicatorConfiguration,
        {
          where: { id: dto.indicatorConfigId },
        },
      );
      if (!config)
        throw new EntityNotFoundException(
          'MsnpIndicatorConfiguration',
          dto.indicatorConfigId,
        );

      await this.validateDisaggregationPayload(
        queryRunner,
        dto.indicatorConfigId,
        dto.disaggregations,
      );

      const data = queryRunner.manager.create(MsnpIndicatorData, {
        indicatorConfigId: dto.indicatorConfigId,
        fiscalYearId: dto.fiscalYearId,
        indicatorId: config.indicatorId,
        value: dto.value,
        dataSource: dto.dataSource,
        remarks: dto.remarks,
        submittedBy: userId,
      });

      const saved = await queryRunner.manager.save(data);

      if (dto.disaggregations && dto.disaggregations.length > 0) {
        const disaggData = dto.disaggregations.map((d) =>
          queryRunner.manager.create(MsnpIndicatorDisaggregationData, {
            msnpIndicatorDataId: saved.id,
            disaggregationOptionId: d.disaggregationOptionId,
            value: d.value,
          }),
        );
        await queryRunner.manager.save(disaggData);
      }

      await queryRunner.commitTransaction();

      const fullSaved = await this.findById(saved.id);

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'msnp_indicator_data',
        resourceId: saved.id,
        after: sanitizeForAudit(fullSaved),
      });

      return fullSaved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create indicator data', {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async bulkUpsert(
    dto: BulkUpsertMsnpIndicatorDataDto,
    userId: string,
  ): Promise<MsnpIndicatorDataResponseDto[]> {
    const responses: MsnpIndicatorDataResponseDto[] = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fiscalYear = await queryRunner.manager.findOne(FiscalYear, {
        where: { id: dto.fiscalYearId },
      });
      if (!fiscalYear?.isActive) {
        throw new BusinessLogicException(
          'Data entry is only permitted for the active fiscal year.',
        );
      }
      const configIds = [
        ...new Set(dto.entries.map((e) => e.indicatorConfigId)),
      ];
      const configs = await queryRunner.manager.find(
        MsnpIndicatorConfiguration,
        {
          where: configIds.map((id) => ({ id })),
        },
      );
      const configMap = new Map(configs.map((c) => [c.id, c.indicatorId]));

      for (let idx = 0; idx < dto.entries.length; idx++) {
        const entry = dto.entries[idx];
        const indicatorId = configMap.get(entry.indicatorConfigId);
        if (!indicatorId) {
          throw new EntityNotFoundException(
            'MsnpIndicatorConfiguration',
            entry.indicatorConfigId,
          );
        }

        await this.validateDisaggregationPayload(
          queryRunner,
          entry.indicatorConfigId,
          entry.disaggregations,
          `entries.${idx}.disaggregations`,
        );

        const existing = await queryRunner.manager.findOne(MsnpIndicatorData, {
          where: {
            fiscalYearId: dto.fiscalYearId,
            indicatorConfigId: entry.indicatorConfigId,
          },
        });

        if (existing) {
          const before = { ...existing };
          const updatedData = {
            value: entry.value,
            dataSource:
              entry.dataSource !== undefined
                ? entry.dataSource
                : existing.dataSource,
            remarks:
              entry.remarks !== undefined ? entry.remarks : existing.remarks,
            submittedBy: userId,
          };

          await queryRunner.manager.update(
            MsnpIndicatorData,
            existing.id,
            updatedData,
          );

          if (entry.disaggregations) {
            const existingDisaggs = await queryRunner.manager.find(
              MsnpIndicatorDisaggregationData,
              {
                where: { msnpIndicatorDataId: existing.id },
              },
            );
            if (existingDisaggs.length > 0) {
              await queryRunner.manager.softRemove(existingDisaggs);
            }

            const newDisaggData = entry.disaggregations.map((d) =>
              queryRunner.manager.create(MsnpIndicatorDisaggregationData, {
                msnpIndicatorDataId: existing.id,
                disaggregationOptionId: d.disaggregationOptionId,
                value: d.value,
              }),
            );
            await queryRunner.manager.save(newDisaggData);
          }

          const fullUpdated = await queryRunner.manager.findOne(
            MsnpIndicatorData,
            {
              where: { id: existing.id },
              relations: [
                'disaggregationData',
                'disaggregationData.disaggregationOption',
              ],
            },
          );

          await this.auditLogService.log({
            action: AuditAction.UPDATE,
            resource: 'msnp_indicator_data',
            resourceId: existing.id,
            before: sanitizeForAudit(before),
            after: sanitizeForAudit(fullUpdated),
          });

          responses.push(this.toResponse(fullUpdated!, DEFAULT_LOCALE));
        } else {
          const newData = queryRunner.manager.create(MsnpIndicatorData, {
            indicatorConfigId: entry.indicatorConfigId,
            indicatorId,
            fiscalYearId: dto.fiscalYearId,
            value: entry.value,
            dataSource: entry.dataSource,
            remarks: entry.remarks,
            submittedBy: userId,
          });
          const saved = await queryRunner.manager.save(newData);

          if (entry.disaggregations && entry.disaggregations.length > 0) {
            const disaggData = entry.disaggregations.map((d) =>
              queryRunner.manager.create(MsnpIndicatorDisaggregationData, {
                msnpIndicatorDataId: saved.id,
                disaggregationOptionId: d.disaggregationOptionId,
                value: d.value,
              }),
            );
            await queryRunner.manager.save(disaggData);
          }

          const fullSaved = await queryRunner.manager.findOne(
            MsnpIndicatorData,
            {
              where: { id: saved.id },
              relations: [
                'disaggregationData',
                'disaggregationData.disaggregationOption',
              ],
            },
          );

          await this.auditLogService.log({
            action: AuditAction.CREATE,
            resource: 'msnp_indicator_data',
            resourceId: saved.id,
            after: sanitizeForAudit(fullSaved),
          });

          responses.push(this.toResponse(fullSaved!, DEFAULT_LOCALE));
        }
      }

      await queryRunner.commitTransaction();
      return responses;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to bulk upsert indicator data', {
        error: (error as Error).message,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: { fiscalYearId: string; locale?: string },
    roleId?: string,
  ): Promise<DataEntryFormResponseDto[]> {
    const locale = (query.locale as SupportedLocale) || DEFAULT_LOCALE;

    if (!roleId) {
      return [];
    }

    const getLocalizedName = (nameObj?: Record<string, string>) => {
      if (!nameObj) return '';
      return nameObj[locale] ?? (nameObj['en'] || nameObj['ne'] || '');
    };

    const configs = await this.dataSource.manager.find(
      MsnpIndicatorConfiguration,
      {
        where: { roleId, isActive: true },
        relations: [
          'indicator',
          'disaggregations',
          'disaggregations.disaggregationType',
          'disaggregations.disaggregationType.options',
          'disaggregations.options',
          'disaggregations.options.disaggregationOption',
        ],
        order: { createdAt: 'ASC' },
      },
    );

    if (configs.length === 0) return [];

    const existingData = await this.dataRepository.find({
      where: {
        fiscalYearId: query.fiscalYearId,
        indicatorConfigId: In(configs.map((c) => c.id)),
      },
      relations: ['disaggregationData'],
    });

    const dataMap = new Map<string, MsnpIndicatorData>();
    for (const d of existingData) {
      dataMap.set(d.indicatorConfigId, d);
    }

    return configs.map((config) => {
      const data = dataMap.get(config.id);

      const disaggregations = (config.disaggregations || []).map((disagg) => {
        const type = disagg.disaggregationType;
        let optionsList = [];

        if (type.isSelective) {
          optionsList = (disagg.options || []).map(
            (o) => o.disaggregationOption,
          );
        } else {
          optionsList = type.options || [];
        }

        const options = optionsList.map((opt) => {
          let value = null;
          if (data && data.disaggregationData) {
            const valObj = data.disaggregationData.find(
              (dd) => dd.disaggregationOptionId === opt.id,
            );
            if (valObj) value = valObj.value;
          }

          return {
            disaggregationOptionId: opt.id,
            disaggregationOptionName: getLocalizedName(
              opt.name as unknown as Record<string, string>,
            ),
            value,
          };
        });

        return {
          disaggregationTypeId: type.id,
          disaggregationTypeName: getLocalizedName(
            type.name as unknown as Record<string, string>,
          ),
          options,
        };
      });

      return {
        indicatorConfigId: config.id,
        indicatorId: config.indicatorId,
        indicatorCode: config.indicator?.code,
        indicatorName: getLocalizedName(
          config.indicator?.name as unknown as Record<string, string>,
        ),
        unit: config.unit || null,
        value: data ? data.value : null,
        dataSource: data ? data.dataSource : null,
        remarks: data ? data.remarks : null,
        disaggregations,
      };
    });
  }

  async findById(
    id: string,
    locale: SupportedLocale = DEFAULT_LOCALE,
  ): Promise<MsnpIndicatorDataResponseDto> {
    const record = await this.dataRepository.findOne({
      where: { id },
      relations: [
        'disaggregationData',
        'disaggregationData.disaggregationOption',
      ],
    });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorData', id);
    }
    return this.toResponse(record, locale);
  }

  async update(
    id: string,
    dto: UpdateMsnpIndicatorDataDto,
  ): Promise<MsnpIndicatorDataResponseDto> {
    const existing = await this.dataRepository.findOne({ where: { id } });
    if (!existing) {
      throw new EntityNotFoundException('MsnpIndicatorData', id);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fiscalYear = await queryRunner.manager.findOne(FiscalYear, {
        where: { id: existing.fiscalYearId },
      });
      if (!fiscalYear?.isActive) {
        throw new BusinessLogicException(
          'Data entry is only permitted for the active fiscal year.',
        );
      }
      const before = { ...existing };

      const updatedData = {
        value: dto.value !== undefined ? dto.value : existing.value,
        dataSource:
          dto.dataSource !== undefined ? dto.dataSource : existing.dataSource,
        remarks: dto.remarks !== undefined ? dto.remarks : existing.remarks,
      };

      await queryRunner.manager.update(MsnpIndicatorData, id, updatedData);

      if (dto.disaggregations) {
        await this.validateDisaggregationPayload(
          queryRunner,
          existing.indicatorConfigId,
          dto.disaggregations,
        );

        const existingDisaggs = await queryRunner.manager.find(
          MsnpIndicatorDisaggregationData,
          {
            where: { msnpIndicatorDataId: id },
          },
        );
        if (existingDisaggs.length > 0) {
          await queryRunner.manager.softRemove(existingDisaggs);
        }

        const newDisaggData = dto.disaggregations.map((d) =>
          queryRunner.manager.create(MsnpIndicatorDisaggregationData, {
            msnpIndicatorDataId: id,
            disaggregationOptionId: d.disaggregationOptionId,
            value: d.value,
          }),
        );
        await queryRunner.manager.save(newDisaggData);
      }

      await queryRunner.commitTransaction();

      const fullUpdated = await this.findById(id);

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'msnp_indicator_data',
        resourceId: id,
        before: sanitizeForAudit(before),
        after: sanitizeForAudit(fullUpdated),
      });

      return fullUpdated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update indicator data: ${id}`, {
        error: (error as Error).message,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const record = await this.dataRepository.findOne({ where: { id } });
    if (!record) {
      throw new EntityNotFoundException('MsnpIndicatorData', id);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingDisaggs = await queryRunner.manager.find(
        MsnpIndicatorDisaggregationData,
        {
          where: { msnpIndicatorDataId: id },
        },
      );
      if (existingDisaggs.length > 0) {
        await queryRunner.manager.softRemove(existingDisaggs);
      }

      await queryRunner.manager.softDelete(MsnpIndicatorData, id);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.SOFT_DELETE,
        resource: 'msnp_indicator_data',
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
    entity: MsnpIndicatorData,
    locale: SupportedLocale,
  ): MsnpIndicatorDataResponseDto {
    const getLocalizedName = (nameObj?: Record<string, string>) => {
      if (!nameObj) return '';
      return nameObj[locale] ?? (nameObj['en'] || nameObj['ne'] || '');
    };

    return {
      id: entity.id,
      indicatorConfigId: entity.indicatorConfigId,
      indicatorId: entity.indicatorId,
      fiscalYearId: entity.fiscalYearId,
      value: entity.value,
      dataSource: entity.dataSource,
      remarks: entity.remarks,
      submittedBy: entity.submittedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      disaggregations: entity.disaggregationData?.map((d) => ({
        disaggregationOptionId: d.disaggregationOptionId,
        disaggregationOptionName: getLocalizedName(
          d.disaggregationOption?.name as unknown as Record<string, string>,
        ),
        value: d.value,
      })),
    };
  }

  private handleDbError(error: any): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23505') {
      throw new BusinessLogicException(
        `Data already exists for this configuration and fiscal year`,
      );
    }
    throw error;
  }
}
