import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type } from '../types/entities/type.entity';
import { MsnpIndicatorConfiguration } from '../msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Type)
    private readonly typeRepo: Repository<Type>,
    @InjectRepository(MsnpIndicatorConfiguration)
    private readonly configRepo: Repository<MsnpIndicatorConfiguration>,
  ) {}

  async getIndicatorSummary(filter?: string, fiscalYearId?: string) {
    const qb = this.typeRepo
      .createQueryBuilder('type')
      .where('type.isActive = :isActive', { isActive: true });

    if (filter && filter !== 'All') {
      qb.andWhere('type.category = :filter', { filter });
    }

    qb.orderBy('type.createdAt', 'ASC');
    const types = await qb.getMany();

    if (!types.length) return [];

    const configs = await this.configRepo
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.indicator', 'indicator')
      .leftJoinAndSelect('config.sector', 'sector')
      .where('config.typeId IN (:...typeIds)', {
        typeIds: types.map((t) => t.id),
      })
      .andWhere('config.isActive = :isActive', { isActive: true })
      .getMany();

    const configIds = configs.map((c) => c.id);

    interface TargetQueryResult {
      configId: string;
      targetValue: string;
      fiscalYear: string;
    }

    interface CurrentDataQueryResult {
      configId: string;
      currentStatus: string;
      dataSource: string;
      remarks: string;
      dataId: string;
    }

    let targets: TargetQueryResult[] = [];
    if (configIds.length) {
      targets = await this.configRepo.manager.query(
        `
        SELECT t.indicator_config_id as "configId", t.target_value as "targetValue", fy.year as "fiscalYear"
        FROM msnp_indicator_targets t
        JOIN fiscal_years fy ON t.fiscal_year_id = fy.id
        WHERE t.indicator_config_id = ANY($1)
        ORDER BY fy.year ASC
      `,
        [configIds],
      );
    }

    let currentData: CurrentDataQueryResult[] = [];
    if (configIds.length && fiscalYearId) {
      currentData = await this.configRepo.manager.query(
        `
         SELECT indicator_config_id as "configId", value as "currentStatus", data_source as "dataSource", remarks, id as "dataId"
         FROM msnp_indicator_data
         WHERE indicator_config_id = ANY($1) AND fiscal_year_id = $2
       `,
        [configIds, fiscalYearId],
      );
    } else if (configIds.length) {
      currentData = await this.configRepo.manager.query(
        `
         SELECT d.indicator_config_id as "configId", d.value as "currentStatus", d.data_source as "dataSource", d.remarks, d.id as "dataId"
         FROM msnp_indicator_data d
         JOIN fiscal_years fy ON d.fiscal_year_id = fy.id
         WHERE d.indicator_config_id = ANY($1) AND fy.is_active = true
       `,
        [configIds],
      );
    }

    interface ConfiguredDisaggregationQueryResult {
      configId: string;
      optionId: string;
      optionName: string;
      typeId: string;
      typeName: string;
    }

    let configuredDisaggregations: ConfiguredDisaggregationQueryResult[] = [];
    if (configIds.length) {
      configuredDisaggregations = await this.configRepo.manager.query(
        `
         SELECT 
           d.configuration_id as "configId", 
           o.id as "optionId", 
           o.name as "optionName",
           dt.id as "typeId",
           dt.name as "typeName"
         FROM msnp_indicator_disaggregations d
         JOIN disaggregation_types dt ON dt.id = d.disaggregation_type_id
         JOIN disaggregation_options o ON o.disaggregation_type_id = d.disaggregation_type_id
         LEFT JOIN msnp_indicator_disaggregation_options opt 
           ON opt.indicator_disaggregation_id = d.id AND opt.disaggregation_option_id = o.id
         WHERE d.configuration_id = ANY($1)
           AND (
             opt.id IS NOT NULL 
             OR NOT EXISTS (SELECT 1 FROM msnp_indicator_disaggregation_options WHERE indicator_disaggregation_id = d.id)
           )
        `,
        [configIds],
      );
    }

    interface SubmittedDisaggregationQueryResult {
      dataId: string;
      optionId: string;
      value: string;
    }

    let submittedDisaggregations: SubmittedDisaggregationQueryResult[] = [];
    const dataIds = currentData.map((d) => d.dataId);

    if (dataIds.length) {
      submittedDisaggregations = await this.configRepo.manager.query(
        `
         SELECT dd.msnp_indicator_data_id as "dataId", dd.disaggregation_option_id as "optionId", dd.value
         FROM msnp_indicator_disaggregation_data dd
         WHERE dd.msnp_indicator_data_id = ANY($1)
        `,
        [dataIds],
      );
    }

    const targetsByConfig = targets.reduce(
      (
        acc: Record<string, { fiscalYear: string; targetValue: string }[]>,
        curr: TargetQueryResult,
      ) => {
        if (!acc[curr.configId]) acc[curr.configId] = [];
        acc[curr.configId].push({
          fiscalYear: curr.fiscalYear,
          targetValue: curr.targetValue,
        });
        return acc;
      },
      {},
    );

    const dataByConfig = currentData.reduce(
      (
        acc: Record<
          string,
          {
            currentStatus: string;
            dataSource: string;
            remarks: string;
            dataId: string;
          }
        >,
        curr: CurrentDataQueryResult,
      ) => {
        acc[curr.configId] = {
          currentStatus: curr.currentStatus,
          dataSource: curr.dataSource,
          remarks: curr.remarks,
          dataId: curr.dataId,
        };
        return acc;
      },
      {},
    );

    const response = types.map((type) => {
      const typeConfigs = configs.filter((c) => c.typeId === type.id);

      const indicators = typeConfigs.map((config) => {
        const data = dataByConfig[config.id];

        const configDisaggregations = configuredDisaggregations.filter(
          (d) => d.configId === config.id,
        );

        const disaggregationsByType = configDisaggregations.reduce(
          (
            acc: Record<
              string,
              {
                typeId: string;
                typeName: string;
                options: {
                  optionId: string;
                  optionName: string;
                  value: string | null;
                }[];
              }
            >,
            cd,
          ) => {
            if (!acc[cd.typeId]) {
              acc[cd.typeId] = {
                typeId: cd.typeId,
                typeName: cd.typeName,
                options: [],
              };
            }
            let value = null;
            if (data && data.dataId) {
              const submitted = submittedDisaggregations.find(
                (sd) =>
                  sd.dataId === data.dataId && sd.optionId === cd.optionId,
              );
              if (submitted) {
                value = submitted.value;
              }
            }
            acc[cd.typeId].options.push({
              optionId: cd.optionId,
              optionName: cd.optionName,
              value: value,
            });
            return acc;
          },
          {},
        );

        const disaggregations = Object.values(disaggregationsByType);

        return {
          indicatorConfigId: config.id,
          indicatorCode: config.indicator?.code || '',
          indicatorName: config.indicator?.name || '',
          sector: config.sector?.name || '',
          unit: config.unit || '',
          currentStatus: data?.currentStatus || null,
          dataSource: data?.dataSource || null,
          remarks: data?.remarks || null,
          disaggregations: disaggregations,
          targets: targetsByConfig[config.id] || [],
        };
      });

      // Sort indicators by indicatorCode numerically
      indicators.sort((a, b) =>
        (a.indicatorCode || '').localeCompare(
          b.indicatorCode || '',
          undefined,
          { numeric: true, sensitivity: 'base' },
        ),
      );

      return {
        id: type.id,
        name: type.name,
        description: type.description,
        category: type.category,
        indicators,
      };
    });

    return response;
  }
}
