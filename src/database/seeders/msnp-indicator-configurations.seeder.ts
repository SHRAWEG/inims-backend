import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { MsnpIndicator } from '../../modules/msnp-indicators/entities/msnp-indicator.entity';
import { Sector } from '../../modules/sectors/entities/sector.entity';
import { Type } from '../../modules/types/entities/type.entity';
import { DisaggregationType } from '../../modules/disaggregation-types/entities/disaggregation-type.entity';
import { MsnpIndicatorConfiguration } from '../../modules/msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { MsnpIndicatorDisaggregation } from '../../modules/msnp-indicator-configurations/entities/msnp-indicator-disaggregation.entity';

// Map Excel column headers to English DisaggregationType names in DB
const DISAGGREGATION_MAP: Record<string, string> = {
  Province: 'Province',
  'Local Level': 'Local Level (/)',
  'Age Group': 'Age Group',
  Sex: 'Sex',
  'Ethnic Group': 'Ethnic group',
  'Wealth Quintile': 'Wealth Quintile',
  'Local Government': 'Local government /',
  Residence: 'Residence',
  'Mother’s Education': "Mother's Education",
  'Mothers Age Group': 'Mothers Age Group',
  Education: 'Education',
  'School Education Level': 'School Education Level',
};

interface MsnpIndicatorConfigRow {
  Code?: string | number;
  Types?: string;
  Sector?: string;
  'M&E_Framework'?: string;
  Result_Framework?: string;
  'Data Collection Method'?: string;
  'Responsible Authority'?: string;
  'Supporting Authority'?: string;
  Frequency?: string;
  'Report Preparation and Utility'?: string;
  Unit?: string;
  [key: string]: string | number | undefined | null;
}

export async function seedMsnpIndicatorConfigurations(
  dataSource: DataSource,
): Promise<void> {
  const logger = new Logger('MsnpIndicatorConfigurationsSeeder');
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const dataPath = path.join(
      __dirname,
      'data',
      'msnp-indicator-configurations-seed-data.json',
    );

    if (!fs.existsSync(dataPath)) {
      logger.warn(
        'Seed data file not found. Skipping seeding of MSNP Indicator Configurations.',
      );
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data: MsnpIndicatorConfigRow[] = JSON.parse(
      rawData,
    ) as MsnpIndicatorConfigRow[];

    logger.log(
      `Found ${data.length} rows in msnp-indicator-configurations-seed-data.json`,
    );

    for (const row of data) {
      const code = String(row['Code']);
      if (!code || code === 'undefined') continue;

      const typeName = row['Types'];
      const sectorName = row['Sector'];

      // Find indicator
      const indicator = await queryRunner.manager.findOne(MsnpIndicator, {
        where: { code },
      });

      if (!indicator) {
        logger.warn(`Indicator with code ${code} not found, skipping row.`);
        continue;
      }

      // Find sector
      let sector = null;
      if (sectorName) {
        sector = await queryRunner.manager
          .createQueryBuilder(Sector, 's')
          .where(`s.name->>'ne' = :name OR s.name->>'en' = :name`, {
            name: sectorName,
          })
          .getOne();
      }

      // Find type
      let type = null;
      if (typeName) {
        type = await queryRunner.manager
          .createQueryBuilder(Type, 't')
          .where(`t.name->>'ne' = :name OR t.name->>'en' = :name`, {
            name: typeName,
          })
          .getOne();
      }

      const isMandEFramework =
        String(row['M&E_Framework']).toLowerCase() === 'yes';
      const isResultFramework =
        String(row['Result_Framework']).toLowerCase() === 'yes';
      const dataCollectionMethod = row['Data Collection Method']
        ? String(row['Data Collection Method'])
        : null;
      const responsibleAuthority = row['Responsible Authority']
        ? String(row['Responsible Authority'])
        : null;
      const supportingAuthority = row['Supporting Authority']
        ? String(row['Supporting Authority'])
        : null;
      const frequency = row['Frequency'] ? String(row['Frequency']) : null;
      const reportPreparationAndUtility = row['Report Preparation and Utility']
        ? String(row['Report Preparation and Utility'])
        : null;
      const unit = row['Unit'] ? String(row['Unit']) : null;

      // Handle possible variations of the column name due to spaces
      let disseminationAndDistribution: string | null = null;
      for (const key of Object.keys(row)) {
        if (
          key.trim() ===
          'Dissemination and Distribution of Monitoring and Evaluation Reports'
        ) {
          disseminationAndDistribution = row[key] ? String(row[key]) : null;
          break;
        }
      }

      // Find or create configuration
      let config = await queryRunner.manager.findOne(
        MsnpIndicatorConfiguration,
        { where: { indicatorId: indicator.id } },
      );

      if (!config) {
        config = queryRunner.manager.create(MsnpIndicatorConfiguration, {
          indicatorId: indicator.id,
          sectorId: sector?.id || null,
          typeId: type?.id || null,
          unit,
          isMandEFramework,
          isResultFramework,
          dataCollectionMethod,
          responsibleAuthority,
          supportingAuthority,
          frequency,
          reportPreparationAndUtility,
          disseminationAndDistribution,
        });
        config = await queryRunner.manager.save(config);
      } else {
        config.sectorId = sector?.id || null;
        config.typeId = type?.id || null;
        config.unit = unit;
        config.isMandEFramework = isMandEFramework;
        config.isResultFramework = isResultFramework;
        config.dataCollectionMethod = dataCollectionMethod;
        config.responsibleAuthority = responsibleAuthority;
        config.supportingAuthority = supportingAuthority;
        config.frequency = frequency;
        config.reportPreparationAndUtility = reportPreparationAndUtility;
        config.disseminationAndDistribution = disseminationAndDistribution;
        config = await queryRunner.manager.save(config);
      }

      // Clear existing disaggregations
      await queryRunner.manager.delete(MsnpIndicatorDisaggregation, {
        configurationId: config.id,
      });

      // Map and create disaggregations
      for (const [excelCol, dbName] of Object.entries(DISAGGREGATION_MAP)) {
        // Attempt to find the exact column name including possible variations
        let colValue = null;
        for (const key of Object.keys(row)) {
          if (key.trim() === excelCol) {
            colValue = row[key];
            break;
          }
        }

        if (String(colValue).toLowerCase() === 'yes') {
          const disaggType = await queryRunner.manager
            .createQueryBuilder(DisaggregationType, 'dt')
            .where(`dt.name->>'en' = :name`, { name: dbName })
            .getOne();

          if (disaggType) {
            const msnpDisagg = queryRunner.manager.create(
              MsnpIndicatorDisaggregation,
              {
                configurationId: config.id,
                disaggregationTypeId: disaggType.id,
              },
            );
            await queryRunner.manager.save(msnpDisagg);
          } else {
            logger.warn(
              `DisaggregationType mapping "${dbName}" not found in DB`,
            );
          }
        }
      }
    }

    await queryRunner.commitTransaction();
    logger.log('MSNP Indicator Configurations seeding completed successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    logger.error('Error seeding MSNP Indicator Configurations:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
