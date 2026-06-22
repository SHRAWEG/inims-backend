import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeContentHtmlContentNullable1782109794610
  implements MigrationInterface
{
  name = 'MakeContentHtmlContentNullable1782109794610';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "html_content" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contents" ALTER COLUMN "html_content" SET NOT NULL`,
    );
  }
}
