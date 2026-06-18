import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChildContentsTable1781089098651 implements MigrationInterface {
  name = 'CreateChildContentsTable1781089098651';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_cee52fec66d922bac7e2e2f21b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee52fec66d922bac7e2e2f21b"`,
    );
    await queryRunner.query(
      `CREATE TABLE "child_contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "slug" character varying NOT NULL, "html_content" text NOT NULL, "parent_id" uuid, CONSTRAINT "PK_182cafb5d93e7097b25f91cb194" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4d7a1c94a5db6717b21a08c0d" ON "child_contents" ("parent_id") `,
    );
    await queryRunner.query(`ALTER TABLE "contents" DROP COLUMN "parent_id"`);
    await queryRunner.query(
      `ALTER TABLE "child_contents" ADD CONSTRAINT "FK_f4d7a1c94a5db6717b21a08c0d5" FOREIGN KEY ("parent_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "child_contents" DROP CONSTRAINT "FK_f4d7a1c94a5db6717b21a08c0d5"`,
    );
    await queryRunner.query(`ALTER TABLE "contents" ADD "parent_id" uuid`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f4d7a1c94a5db6717b21a08c0d"`,
    );
    await queryRunner.query(`DROP TABLE "child_contents"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cee52fec66d922bac7e2e2f21b" ON "contents" ("parent_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ADD CONSTRAINT "FK_cee52fec66d922bac7e2e2f21b0" FOREIGN KEY ("parent_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
