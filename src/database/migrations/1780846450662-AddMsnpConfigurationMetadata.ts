import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMsnpConfigurationMetadata1780846450662 implements MigrationInterface {
  name = 'AddMsnpConfigurationMetadata1780846450662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "data_collection_method" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "responsible_authority" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "supporting_authority" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "frequency" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "report_preparation_and_utility" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "dissemination_and_distribution" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "dissemination_and_distribution"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "report_preparation_and_utility"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "frequency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "supporting_authority"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "responsible_authority"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "data_collection_method"`,
    );
  }
}
