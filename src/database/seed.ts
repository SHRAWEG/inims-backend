import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { seedPermissions } from './seeders/permissions.seeder';
import { seedSuperAdmin } from './seeders/superadmin.seeder';
import { seedMsnpData } from './seeders/msnp-data.seeder';
import { seedDisaggregations } from './seeders/disaggregations.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const logger = new Logger('Seeder');

  console.log('--- Starting Seeding ---');

  try {
    await seedPermissions(dataSource);
    await seedSuperAdmin(dataSource);
    logger.log('Seeding MSNP Data (Sectors, Types, Indicators)...');
    await seedMsnpData(dataSource);

    logger.log('Seeding Disaggregations Data...');
    await seedDisaggregations(dataSource);

    logger.log('All seeders executed successfully.');
  } catch (error) {
    console.error('--- Seeding Failed ---');
    console.error(error);
  } finally {
    await app.close();
  }
}

void bootstrap();
