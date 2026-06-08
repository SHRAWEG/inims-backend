import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMsnpConfigurationBooleansAndBaseYear1780846585117 implements MigrationInterface {
  name = 'AddMsnpConfigurationBooleansAndBaseYear1780846585117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "is_m_and_e_framework" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "is_result_framework" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "base_year" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "base_year"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "is_result_framework"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "is_m_and_e_framework"`,
    );
  }
}
