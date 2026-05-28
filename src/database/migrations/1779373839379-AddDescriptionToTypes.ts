import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToTypes1779373839379 implements MigrationInterface {
  name = 'AddDescriptionToTypes1779373839379';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "types" ADD "description" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "types" DROP COLUMN "description"`);
  }
}
