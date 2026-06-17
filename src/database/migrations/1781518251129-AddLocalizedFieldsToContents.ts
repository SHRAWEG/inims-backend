import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalizedFieldsToContents1781518251129 implements MigrationInterface {
  name = 'AddLocalizedFieldsToContents1781518251129';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint and index on contents.title (no longer unique as jsonb)
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT IF EXISTS "UQ_214ca676bed3cd02947f6d64bcf"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_214ca676bed3cd02947f6d64bc"`,
    );

    // Convert contents.title from varchar → jsonb, preserving existing data as both en/ne
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('en', "title", 'ne', "title")`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "title" SET NOT NULL`,
    );

    // Convert contents.html_content from text → jsonb, same pattern
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "html_content" TYPE jsonb USING jsonb_build_object('en', "html_content", 'ne', "html_content")`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "html_content" SET NOT NULL`,
    );

    // Convert child_contents.title from varchar → jsonb
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('en', "title", 'ne', "title")`,
    );
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "title" SET NOT NULL`,
    );

    // Convert child_contents.html_content from text → jsonb
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "html_content" TYPE jsonb USING jsonb_build_object('en', "html_content", 'ne', "html_content")`,
    );
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "html_content" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert child_contents.html_content: jsonb → text (extract English)
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "html_content" TYPE text USING ("html_content"->>'en')`,
    );
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "html_content" SET NOT NULL`,
    );

    // Revert child_contents.title: jsonb → varchar
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "title" TYPE character varying USING ("title"->>'en')`,
    );
    await queryRunner.query(
      `ALTER TABLE "child_contents" ALTER COLUMN "title" SET NOT NULL`,
    );

    // Revert contents.html_content: jsonb → text
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "html_content" TYPE text USING ("html_content"->>'en')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "html_content" SET NOT NULL`,
    );

    // Revert contents.title: jsonb → varchar, restore unique constraint + index
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "title" TYPE character varying USING ("title"->>'en')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "title" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" ADD CONSTRAINT "UQ_214ca676bed3cd02947f6d64bcf" UNIQUE ("title")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_214ca676bed3cd02947f6d64bc" ON "contents" ("title")`,
    );
  }
}
