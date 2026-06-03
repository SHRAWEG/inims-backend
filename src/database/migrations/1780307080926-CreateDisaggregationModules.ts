import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDisaggregationModules1780307080926 implements MigrationInterface {
  name = 'CreateDisaggregationModules1780307080926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "disaggregation_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "disaggregation_type_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "code" character varying(50), "sort_order" integer, CONSTRAINT "PK_7c7fa47f97d6bb18ddf7f60cf4d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_68b27087b17f03bcb433498d41" ON "disaggregation_options" ("disaggregation_type_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "disaggregation_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "is_selective" boolean NOT NULL DEFAULT false, "sort_order" integer, CONSTRAINT "PK_2fdcbcd3127812ccfc89f7b7852" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_756fc573a7d90c8c58be76ca03" ON "disaggregation_types" ("name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "disaggregation_options" ADD CONSTRAINT "FK_68b27087b17f03bcb433498d414" FOREIGN KEY ("disaggregation_type_id") REFERENCES "disaggregation_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "disaggregation_options" DROP CONSTRAINT "FK_68b27087b17f03bcb433498d414"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_756fc573a7d90c8c58be76ca03"`,
    );
    await queryRunner.query(`DROP TABLE "disaggregation_types"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_68b27087b17f03bcb433498d41"`,
    );
    await queryRunner.query(`DROP TABLE "disaggregation_options"`);
  }
}
