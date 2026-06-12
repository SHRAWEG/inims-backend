/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { DisaggregationType } from '../../modules/disaggregation-types/entities/disaggregation-type.entity';
import { DisaggregationOption } from '../../modules/disaggregation-options/entities/disaggregation-option.entity';

export async function seedDisaggregations(
  dataSource: DataSource,
): Promise<void> {
  const logger = new Logger('DisaggregationsSeeder');
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Clear the table to resolve duplicate key errors with name translations
    await queryRunner.query('TRUNCATE TABLE disaggregation_types CASCADE');

    const dataPath = path.join(
      __dirname,
      'data',
      'disaggregations-seed-data.json',
    );
    if (!fs.existsSync(dataPath)) {
      logger.warn('Seed data file not found. Run the extraction script first.');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const seedData = JSON.parse(rawData);

    for (const typeData of seedData.disaggregationTypes) {
      // Find existing type by English name (since they are jsonb)
      let type = await queryRunner.manager
        .createQueryBuilder(DisaggregationType, 'dt')
        .where(`dt.name->>'en' = :enName`, { enName: typeData.name.en })
        .getOne();

      if (!type) {
        type = queryRunner.manager.create(DisaggregationType, {
          name: typeData.name,
          isSelective: typeData.isSelective,
          sortOrder: typeData.sortOrder,
        });
        type = await queryRunner.manager.save(type);
        logger.log(`Inserted Disaggregation Type: ${typeData.name.en}`);
      } else {
        // Update
        type.name = typeData.name;
        type.isSelective = typeData.isSelective;
        type.sortOrder = typeData.sortOrder;
        type = await queryRunner.manager.save(type);
        logger.log(`Updated Disaggregation Type: ${typeData.name.en}`);
      }

      // Upsert options
      for (const optionData of typeData.options) {
        let option = await queryRunner.manager
          .createQueryBuilder(DisaggregationOption, 'opt')
          .where(`opt.disaggregation_type_id = :typeId`, { typeId: type.id })
          .andWhere(`opt.name->>'en' = :enName`, { enName: optionData.name.en })
          .getOne();

        if (!option) {
          option = queryRunner.manager.create(DisaggregationOption, {
            disaggregationTypeId: type.id,
            name: optionData.name,
            sortOrder: optionData.sortOrder,
          });
          await queryRunner.manager.save(option);
          logger.log(`  Inserted Disaggregation Option: ${optionData.name.en}`);
        } else {
          // Update
          option.name = optionData.name;
          option.sortOrder = optionData.sortOrder;
          await queryRunner.manager.save(option);
          logger.log(`  Updated Disaggregation Option: ${optionData.name.en}`);
        }
      }
    }

    await queryRunner.commitTransaction();
    logger.log('Disaggregations seeding completed successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    logger.error('Error seeding disaggregations data:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
