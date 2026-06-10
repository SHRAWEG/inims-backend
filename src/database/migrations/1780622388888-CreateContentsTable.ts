import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentsTable1780622388888 implements MigrationInterface {
  name = 'CreateContentsTable1780622388888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "slug" character varying NOT NULL, "html_content" text NOT NULL, CONSTRAINT "UQ_214ca676bed3cd02947f6d64bcf" UNIQUE ("title"), CONSTRAINT "UQ_8a8cf14dab55b4ebcd93bb536a1" UNIQUE ("slug"), CONSTRAINT "PK_b7c504072e537532d7080c54fac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_214ca676bed3cd02947f6d64bc" ON "contents" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a8cf14dab55b4ebcd93bb536a" ON "contents" ("slug") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a8cf14dab55b4ebcd93bb536a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_214ca676bed3cd02947f6d64bc"`,
    );
    await queryRunner.query(`DROP TABLE "contents"`);
  }
}
