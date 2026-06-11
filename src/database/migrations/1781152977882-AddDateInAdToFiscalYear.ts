import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateInAdToFiscalYear1781152977882 implements MigrationInterface {
    name = 'AddDateInAdToFiscalYear1781152977882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fiscal_years" ADD "date_in_ad" character varying(15)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fiscal_years" DROP COLUMN "date_in_ad"`);
    }

}
