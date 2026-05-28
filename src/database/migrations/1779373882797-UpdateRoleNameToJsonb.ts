import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRoleNameToJsonb1779373882797 implements MigrationInterface {
  name = 'UpdateRoleNameToJsonb1779373882797';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "name" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "name" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name")`,
    );
  }
}
