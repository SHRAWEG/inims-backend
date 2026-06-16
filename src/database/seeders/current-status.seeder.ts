import { DataSource } from 'typeorm';
import { FiscalYear } from '../../modules/fiscal-years/entities/fiscal-year.entity';
import { MsnpIndicator } from '../../modules/msnp-indicators/entities/msnp-indicator.entity';
import { MsnpIndicatorConfiguration } from '../../modules/msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { MsnpIndicatorData } from '../../modules/msnp-indicator-data/entities/msnp-indicator-data.entity';
import { User } from '../../modules/users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

interface CurrentStatusRow {
  code: string;
  currentStatus: string;
}

export async function seedCurrentStatus(dataSource: DataSource) {
  const fiscalYearRepo = dataSource.getRepository(FiscalYear);
  const indicatorRepo = dataSource.getRepository(MsnpIndicator);
  const configRepo = dataSource.getRepository(MsnpIndicatorConfiguration);
  const dataRepo = dataSource.getRepository(MsnpIndicatorData);
  const userRepo = dataSource.getRepository(User);

  const targetFy = await fiscalYearRepo.findOne({ where: { year: '2082/83' } });
  if (!targetFy) {
    console.warn(
      'Fiscal year 2082/83 not found, skipping current status seeding.',
    );
    return;
  }

  const superUser = await userRepo.findOne({ where: {} });
  if (!superUser) {
    console.warn(
      'No user found to set as submitted_by, skipping current status seeding.',
    );
    return;
  }

  const dataPath = path.join(
    __dirname,
    'data',
    'current-status-seed-data.json',
  );
  if (!fs.existsSync(dataPath)) {
    console.warn('current-status-seed-data.json not found, skipping.');
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const currentStatusData: CurrentStatusRow[] = JSON.parse(
    rawData,
  ) as CurrentStatusRow[];

  for (const item of currentStatusData) {
    if (!item.code || !item.currentStatus) continue;

    const indicator = await indicatorRepo.findOne({
      where: { code: item.code },
    });
    if (!indicator) continue;

    const config = await configRepo.findOne({
      where: { indicatorId: indicator.id },
    });
    if (!config) continue;

    const existingData = await dataRepo.findOne({
      where: {
        indicatorConfigId: config.id,
        fiscalYearId: targetFy.id,
      },
    });

    if (existingData) {
      existingData.value = item.currentStatus;
      await dataRepo.save(existingData);
    } else {
      const newData = dataRepo.create({
        indicatorConfigId: config.id,
        fiscalYearId: targetFy.id,
        indicatorId: indicator.id,
        value: item.currentStatus,
        submittedBy: superUser.id,
      });
      await dataRepo.save(newData);
    }
  }

  console.log('Current status seeding completed successfully.');
}
