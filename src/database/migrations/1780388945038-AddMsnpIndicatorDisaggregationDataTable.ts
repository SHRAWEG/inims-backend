import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMsnpIndicatorDisaggregationDataTable1780388945038 implements MigrationInterface {
  name = 'AddMsnpIndicatorDisaggregationDataTable1780388945038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_disaggregation_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "msnp_indicator_data_id" uuid NOT NULL, "disaggregation_option_id" uuid NOT NULL, "value" character varying NOT NULL, CONSTRAINT "PK_13b18dfb4776077759f01706e1c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_data" ADD CONSTRAINT "FK_dff0ba13a5fbaccac8132facc10" FOREIGN KEY ("msnp_indicator_data_id") REFERENCES "msnp_indicator_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_data" ADD CONSTRAINT "FK_52714afe7824da80982be76fe4b" FOREIGN KEY ("disaggregation_option_id") REFERENCES "disaggregation_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_data" DROP CONSTRAINT "FK_52714afe7824da80982be76fe4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_disaggregation_data" DROP CONSTRAINT "FK_dff0ba13a5fbaccac8132facc10"`,
    );
    await queryRunner.query(`DROP TABLE "msnp_indicator_disaggregation_data"`);
  }
}
