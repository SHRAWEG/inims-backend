import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { seedPermissions } from './seeders/permissions.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('--- Starting Seeding ---');

  try {
    await seedPermissions(dataSource);
    console.log('--- Seeding Completed Successfully ---');
  } catch (error) {
    console.error('--- Seeding Failed ---');
    console.error(error);
  } finally {
    await app.close();
  }
}

void bootstrap();
