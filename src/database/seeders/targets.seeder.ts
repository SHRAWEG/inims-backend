import { DataSource } from 'typeorm';
import { FiscalYear } from '../../modules/fiscal-years/entities/fiscal-year.entity';
import { MsnpIndicator } from '../../modules/msnp-indicators/entities/msnp-indicator.entity';
import { MsnpIndicatorConfiguration } from '../../modules/msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { MsnpIndicatorTarget } from '../../modules/msnp-indicator-targets/entities/msnp-indicator-target.entity';
import * as fs from 'fs';
import * as path from 'path';

export async function seedTargets(dataSource: DataSource) {
  const fiscalYearRepo = dataSource.getRepository(FiscalYear);
  const indicatorRepo = dataSource.getRepository(MsnpIndicator);
  const configRepo = dataSource.getRepository(MsnpIndicatorConfiguration);
  const targetRepo = dataSource.getRepository(MsnpIndicatorTarget);

  // Define fiscal years mapping
  const fiscalYearsData = [
    { year: '2080/81', dateInAd: '2023', isActive: false },
    { year: '2081/82', dateInAd: '2024', isActive: true },
    { year: '2082/83', dateInAd: '2025', isActive: false },
    { year: '2083/84', dateInAd: '2026', isActive: false },
    { year: '2084/85', dateInAd: '2027', isActive: false },
    { year: '2085/86', dateInAd: '2028', isActive: false },
    { year: '2086/87', dateInAd: '2029', isActive: false },
  ];

  const fiscalYearsMap: Record<string, string> = {};

  for (const fyData of fiscalYearsData) {
    let fy = await fiscalYearRepo.findOne({ where: { year: fyData.year } });
    if (!fy) {
      fy = fiscalYearRepo.create(fyData);
      await fiscalYearRepo.save(fy);
    }
    fiscalYearsMap[fyData.year] = fy.id;
  }

  const targetsData = require('./data/targets-seed-data.json');

  // Process rows
  for (const item of targetsData) {
    const indicatorCode = item.code;
    if (!indicatorCode) continue;

    // Find indicator
    const indicator = await indicatorRepo.findOne({ where: { code: indicatorCode } });
    if (!indicator) {
      console.warn(`Indicator with code ${indicatorCode} not found, skipping targets.`);
      continue;
    }

    // Find config
    const config = await configRepo.findOne({ where: { indicatorId: indicator.id } });
    if (!config) {
      console.warn(`Configuration for indicator code ${indicatorCode} not found, skipping targets.`);
      continue;
    }

    const targets = [
      { fy: '2080/81', val: item.targets['2080/81'] },
      { fy: '2081/82', val: item.targets['2081/82'] },
      { fy: '2082/83', val: item.targets['2082/83'] },
      { fy: '2083/84', val: item.targets['2083/84'] },
      { fy: '2084/85', val: item.targets['2084/85'] },
      { fy: '2085/86', val: item.targets['2085/86'] },
      { fy: '2086/87', val: item.targets['2086/87'] },
    ];

    for (const target of targets) {
      if (target.val !== undefined && target.val !== null && target.val.trim() !== '') {
        const fyId = fiscalYearsMap[target.fy];
        const val = target.val.trim();

        let existingTarget = await targetRepo.findOne({
          where: {
            indicatorConfigId: config.id,
            fiscalYearId: fyId,
          },
        });

        if (existingTarget) {
          existingTarget.targetValue = val;
          await targetRepo.save(existingTarget);
        } else {
          const newTarget = targetRepo.create({
            indicatorConfigId: config.id,
            fiscalYearId: fyId,
            indicatorId: indicator.id,
            targetValue: val,
          });
          await targetRepo.save(newTarget);
        }
      }
    }
  }

  console.log('Targets seeding completed successfully.');
}
