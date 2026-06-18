import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentIdToContents1781084359254 implements MigrationInterface {
  name = 'AddParentIdToContents1781084359254';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contents" ADD "parent_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cee52fec66d922bac7e2e2f21b" ON "contents" ("parent_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ADD CONSTRAINT "FK_cee52fec66d922bac7e2e2f21b0" FOREIGN KEY ("parent_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_cee52fec66d922bac7e2e2f21b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee52fec66d922bac7e2e2f21b"`,
    );
    await queryRunner.query(`ALTER TABLE "contents" DROP COLUMN "parent_id"`);
  }
}
