import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueLocalizedNames1780382154039 implements MigrationInterface {
  name = 'EnforceUniqueLocalizedNames1780382154039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_756fc573a7d90c8c58be76ca03"`,
    );

    await queryRunner.query(
      `ALTER TABLE "disaggregation_options" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', name, 'ne', name)`,
    );
    await queryRunner.query(
      `ALTER TABLE "disaggregation_types" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', name, 'ne', name)`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_disaggregation_types_name_en" ON "disaggregation_types" ((name->>'en')) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_disaggregation_types_name_ne" ON "disaggregation_types" ((name->>'ne')) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_disaggregation_options_name_en" ON "disaggregation_options" ("disaggregation_type_id", (name->>'en')) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_disaggregation_options_name_ne" ON "disaggregation_options" ("disaggregation_type_id", (name->>'ne')) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_disaggregation_options_name_ne"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_disaggregation_options_name_en"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_disaggregation_types_name_ne"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_disaggregation_types_name_en"`,
    );

    await queryRunner.query(
      `ALTER TABLE "disaggregation_types" ALTER COLUMN "name" TYPE character varying(255) USING name->>'en'`,
    );
    await queryRunner.query(
      `ALTER TABLE "disaggregation_options" ALTER COLUMN "name" TYPE character varying(255) USING name->>'en'`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_756fc573a7d90c8c58be76ca03" ON "disaggregation_types" ("name") `,
    );
  }
}
