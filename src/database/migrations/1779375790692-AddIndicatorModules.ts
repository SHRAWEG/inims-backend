import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndicatorModules1779375790692 implements MigrationInterface {
  name = 'AddIndicatorModules1779375790692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_configurations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "indicator_id" uuid NOT NULL, "sector_id" uuid, "type_id" uuid, "role_id" uuid, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ad3271e15dcc1269e4c7e1a3032" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fiscal_years" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "year" character varying(7) NOT NULL, "start_date_ad" date, "end_date_ad" date, "is_active" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_a0bb27e1968a5e57e97e10dd36b" UNIQUE ("year"), CONSTRAINT "PK_0470d6bc5c757d488b7b04e1899" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_targets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "indicator_config_id" uuid NOT NULL, "fiscal_year_id" uuid NOT NULL, "target_value" character varying NOT NULL, "remarks" text, CONSTRAINT "UQ_2b57ee3c13a35041b78a051d6bf" UNIQUE ("indicator_config_id", "fiscal_year_id"), CONSTRAINT "PK_9a02cd645eea6c99219c6896f5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "indicator_config_id" uuid NOT NULL, "fiscal_year_id" uuid NOT NULL, "value" character varying NOT NULL, "data_source" character varying, "remarks" text, "submitted_by" uuid NOT NULL, CONSTRAINT "UQ_39e2835d659dea384323648daed" UNIQUE ("indicator_config_id", "fiscal_year_id"), CONSTRAINT "PK_f4b31062be24526cbfeb9bca09c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "types" ALTER COLUMN "description" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_d8728841b65634ad1ded0e56730" FOREIGN KEY ("indicator_id") REFERENCES "msnp_indicators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_1dea4c355d4ea6218d4817a538e" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_5f0c9fb3df0d912f59942969b68" FOREIGN KEY ("type_id") REFERENCES "types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_80aeacf531b381fd7eea1afdbae" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" ADD CONSTRAINT "FK_14180e96b0168948393f849c675" FOREIGN KEY ("indicator_config_id") REFERENCES "msnp_indicator_configurations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" ADD CONSTRAINT "FK_097d4a323d8a5ed8b3c99222030" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD CONSTRAINT "FK_820485a3becdf53aefdc8afeb77" FOREIGN KEY ("indicator_config_id") REFERENCES "msnp_indicator_configurations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD CONSTRAINT "FK_aec8a50442c2d3c491843c849c6" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD CONSTRAINT "FK_a69f6fc94f1708bf55864b97678" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP CONSTRAINT "FK_a69f6fc94f1708bf55864b97678"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP CONSTRAINT "FK_aec8a50442c2d3c491843c849c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP CONSTRAINT "FK_820485a3becdf53aefdc8afeb77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" DROP CONSTRAINT "FK_097d4a323d8a5ed8b3c99222030"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" DROP CONSTRAINT "FK_14180e96b0168948393f849c675"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_80aeacf531b381fd7eea1afdbae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_5f0c9fb3df0d912f59942969b68"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_1dea4c355d4ea6218d4817a538e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_d8728841b65634ad1ded0e56730"`,
    );
    await queryRunner.query(
      `ALTER TABLE "types" ALTER COLUMN "description" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "name" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`DROP TABLE "msnp_indicator_data"`);
    await queryRunner.query(`DROP TABLE "msnp_indicator_targets"`);
    await queryRunner.query(`DROP TABLE "fiscal_years"`);
    await queryRunner.query(`DROP TABLE "msnp_indicator_configurations"`);
  }
}
