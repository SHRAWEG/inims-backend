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
         SELECT indicator_config_id as "configId", value as "currentStatus"
         FROM msnp_indicator_data
         WHERE indicator_config_id = ANY($1) AND fiscal_year_id = $2
       `,
        [configIds, fiscalYearId],
      );
    } else if (configIds.length) {
      currentData = await this.configRepo.manager.query(
        `
         SELECT d.indicator_config_id as "configId", d.value as "currentStatus"
         FROM msnp_indicator_data d
         JOIN fiscal_years fy ON d.fiscal_year_id = fy.id
         WHERE d.indicator_config_id = ANY($1) AND fy.is_active = true
       `,
        [configIds],
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
      (acc: Record<string, string>, curr: CurrentDataQueryResult) => {
        acc[curr.configId] = curr.currentStatus;
        return acc;
      },
      {},
    );

    const response = types.map((type) => {
      const typeConfigs = configs.filter((c) => c.typeId === type.id);

      const indicators = typeConfigs.map((config) => {
        return {
          indicatorConfigId: config.id,
          indicatorCode: config.indicator?.code || '',
          indicatorName: config.indicator?.name || '',
          sector: config.sector?.name || '',
          unit: config.unit || '',
          currentStatus: dataByConfig[config.id] || null,
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
