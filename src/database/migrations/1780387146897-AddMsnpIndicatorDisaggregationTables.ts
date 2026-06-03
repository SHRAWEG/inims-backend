import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMsnpIndicatorDisaggregationTables1780387146897 implements MigrationInterface {
  name = 'AddMsnpIndicatorDisaggregationTables1780387146897';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_disaggregation_options_name_en"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_disaggregation_options_name_ne"`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_disaggregation_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "indicator_disaggregation_id" uuid NOT NULL, "disaggregation_option_id" uuid NOT NULL, CONSTRAINT "PK_1a9fe5ea6c8997e7c626c04f690" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_disaggregations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "configuration_id" uuid NOT NULL, "disaggregation_type_id" uuid NOT NULL, CONSTRAINT "PK_abfb05cf4f6265d68442826d50a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" ADD "indicator_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD "indicator_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_options" ADD CONSTRAINT "FK_7e0f05fd8146c43d64f09f8bb39" FOREIGN KEY ("indicator_disaggregation_id") REFERENCES "msnp_indicator_disaggregations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_options" ADD CONSTRAINT "FK_3b54732ac507a54b61a11d9889f" FOREIGN KEY ("disaggregation_option_id") REFERENCES "disaggregation_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregations" ADD CONSTRAINT "FK_d8c92301a79b2d45b4210a43620" FOREIGN KEY ("configuration_id") REFERENCES "msnp_indicator_configurations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregations" ADD CONSTRAINT "FK_c232c2e243b2e0313bef437bfcd" FOREIGN KEY ("disaggregation_type_id") REFERENCES "disaggregation_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" ADD CONSTRAINT "FK_4c7693b355d848556e8e503aecb" FOREIGN KEY ("indicator_id") REFERENCES "msnp_indicators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD CONSTRAINT "FK_47272a6fd86a51b8e46450b5b43" FOREIGN KEY ("indicator_id") REFERENCES "msnp_indicators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP CONSTRAINT "FK_47272a6fd86a51b8e46450b5b43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" DROP CONSTRAINT "FK_4c7693b355d848556e8e503aecb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregations" DROP CONSTRAINT "FK_c232c2e243b2e0313bef437bfcd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregations" DROP CONSTRAINT "FK_d8c92301a79b2d45b4210a43620"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_options" DROP CONSTRAINT "FK_3b54732ac507a54b61a11d9889f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_options" DROP CONSTRAINT "FK_7e0f05fd8146c43d64f09f8bb39"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP COLUMN "indicator_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" DROP COLUMN "indicator_id"`,
    );
    await queryRunner.query(`DROP TABLE "msnp_indicator_disaggregations"`);
    await queryRunner.query(
      `DROP TABLE "msnp_indicator_disaggregation_options"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_disaggregation_options_name_ne" ON "disaggregation_options" ("disaggregation_type_id") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_disaggregation_options_name_en" ON "disaggregation_options" ("disaggregation_type_id") WHERE (deleted_at IS NULL)`,
    );
  }
}
