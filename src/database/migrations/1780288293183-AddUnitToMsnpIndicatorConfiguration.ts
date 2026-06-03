import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnitToMsnpIndicatorConfiguration1780288293183 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD "unit" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP COLUMN "unit"`,
    );
  }
}
