import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeCategory1781587615960 implements MigrationInterface {
  name = 'AddTypeCategory1781587615960';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."types_category_enum" AS ENUM('Impact', 'Outcome', 'Output')`,
    );
    await queryRunner.query(
      `ALTER TABLE "types" ADD "category" "public"."types_category_enum" NOT NULL DEFAULT 'Outcome'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "types" DROP COLUMN "category"`);
    await queryRunner.query(`DROP TYPE "public"."types_category_enum"`);
  }
}
