import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSortOrderToContents1782377729295 implements MigrationInterface {
    name = 'AddSortOrderToContents1782377729295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "child_contents" ADD "sort_order" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "contents" ADD "sort_order" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "contents" ALTER COLUMN "html_content" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contents" ALTER COLUMN "html_content" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contents" DROP COLUMN "sort_order"`);
        await queryRunner.query(`ALTER TABLE "child_contents" DROP COLUMN "sort_order"`);
    }

}
