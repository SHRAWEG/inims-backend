/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { DataSource } from 'typeorm';
import { Sector } from '../../modules/sectors/entities/sector.entity';
import { Type } from '../../modules/types/entities/type.entity';
import { MsnpIndicator } from '../../modules/msnp-indicators/entities/msnp-indicator.entity';
import * as fs from 'fs';
import * as path from 'path';

export const seedMsnpData = async (dataSource: DataSource) => {
  const sectorRepo = dataSource.getRepository(Sector);
  const typeRepo = dataSource.getRepository(Type);
  const indicatorRepo = dataSource.getRepository(MsnpIndicator);

  const dataPath = path.join(__dirname, 'data', 'msnp-seed-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`[MSNP Seeder] Seed data file not found at ${dataPath}`);
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const seedData = JSON.parse(rawData);

  // Load existing records to avoid jsonb query issues
  const existingSectors = await sectorRepo.find();
  const existingTypes = await typeRepo.find();
  const existingIndicators = await indicatorRepo.find();

  console.log('[MSNP Seeder] Seeding Sectors...');
  for (const s of seedData.sectors) {
    const exists = existingSectors.some(
      (es) => es.name?.ne === s.name.ne || es.name?.en === s.name.en,
    );
    if (!exists) {
      const created = sectorRepo.create(s);
      const saved = await sectorRepo.save(created);
      existingSectors.push(saved as any);
    }
  }

  console.log('[MSNP Seeder] Seeding Types...');
  for (const t of seedData.types) {
    const exists = existingTypes.some(
      (et) => et.name?.ne === t.name.ne || et.name?.en === t.name.en,
    );
    if (!exists) {
      const created = typeRepo.create(t);
      const saved = await typeRepo.save(created);
      existingTypes.push(saved as any);
    }
  }

  console.log('[MSNP Seeder] Seeding Indicators...');
  for (const ind of seedData.indicators) {
    const exists = existingIndicators.some(
      (ei) => ei.code === ind.code || ei.name?.ne === ind.name.ne,
    );
    if (!exists) {
      const created = indicatorRepo.create({
        code: ind.code,
        name: ind.name,
        isActive: ind.isActive,
      });
      const saved = await indicatorRepo.save(created);
      existingIndicators.push(saved);
    }
  }

  console.log('[MSNP Seeder] MSNP Data Seeding Complete!');
};
