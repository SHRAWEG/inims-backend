import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1779950309842 implements MigrationInterface {
  name = 'InitialMigration1779950309842';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resource" character varying(100) NOT NULL, "action" character varying(50) NOT NULL, "description" text, "category" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7331684c0c5b063803a425001a" ON "permissions" ("resource", "action") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" jsonb NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_system_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "system_role" "public"."users_system_role_enum", "role_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "refresh_token_hash" character varying(255), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "name" jsonb NOT NULL, "description" jsonb NOT NULL, CONSTRAINT "PK_33b81de5358589c738907c3559b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sectors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "name" jsonb NOT NULL, CONSTRAINT "PK_923fdda0dc12f59add7b3a1782f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "code" character varying NOT NULL, "name" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_28f755950b6c9b9bb2db4a0649c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_configurations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "indicator_id" uuid NOT NULL, "sector_id" uuid, "type_id" uuid, "role_id" uuid, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_7a943244760e498471185c56e7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fiscal_years" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "year" character varying(7) NOT NULL, "start_date_ad" date, "end_date_ad" date, "is_active" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_a0bb27e1968a5e57e97e10dd36b" UNIQUE ("year"), CONSTRAINT "PK_0470d6bc5c757d488b7b04e1899" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_targets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "indicator_config_id" uuid NOT NULL, "fiscal_year_id" uuid NOT NULL, "target_value" character varying NOT NULL, "remarks" text, CONSTRAINT "UQ_d260dc0339b6c4dc5aee3cd70a2" UNIQUE ("indicator_config_id", "fiscal_year_id"), CONSTRAINT "PK_8d6f2644d0153172ca7980fadb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "msnp_indicator_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "indicator_config_id" uuid NOT NULL, "fiscal_year_id" uuid NOT NULL, "value" character varying NOT NULL, "data_source" character varying, "remarks" text, "submitted_by" uuid NOT NULL, CONSTRAINT "UQ_525371f849eaeb609fc6a5bb80e" UNIQUE ("indicator_config_id", "fiscal_year_id"), CONSTRAINT "PK_035ea50743f8c589d141a2ece76" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "frequencies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "name" jsonb NOT NULL, CONSTRAINT "PK_ccf891824a122c4f205d013862b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "genders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "name" jsonb NOT NULL, CONSTRAINT "PK_529fb131dd4164c94529f53e19d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "age_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "name" jsonb NOT NULL, CONSTRAINT "PK_74553a8c46fc414046f0fd02c70" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_CHANGE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "action" "public"."audit_logs_action_enum" NOT NULL, "resource" character varying(100) NOT NULL, "resource_id" uuid, "before_snapshot" jsonb, "after_snapshot" jsonb, "diff" jsonb, "metadata" jsonb, "ip_address" character varying(45), "user_agent" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON "audit_logs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8769d5d852a6b56dd77186a1c6" ON "audit_logs" ("resource") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_62408b952557958fd12867cfeb" ON "audit_logs" ("resource_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "administrative_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "name" jsonb NOT NULL, CONSTRAINT "PK_ced2922aa7a19738af5885362a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_06c6c1bd78394bb710e8ea6543f" FOREIGN KEY ("indicator_id") REFERENCES "msnp_indicators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_17af56e7e356bda9d3c6d26de6e" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_584712a629194dfe983bb9bd262" FOREIGN KEY ("type_id") REFERENCES "types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" ADD CONSTRAINT "FK_26c45eda03eca4d4c996bd99514" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" ADD CONSTRAINT "FK_2d7c9813e7015ffa0cf8a7fbde9" FOREIGN KEY ("indicator_config_id") REFERENCES "msnp_indicator_configurations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" ADD CONSTRAINT "FK_36b80835c3accfc6e0e304d9685" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD CONSTRAINT "FK_d8f96ce11aa334bbb24deb60ff5" FOREIGN KEY ("indicator_config_id") REFERENCES "msnp_indicator_configurations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD CONSTRAINT "FK_d487f584890d0ca841b019edce9" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" ADD CONSTRAINT "FK_10b37cd4d9ee43288db847a32d3" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP CONSTRAINT "FK_10b37cd4d9ee43288db847a32d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP CONSTRAINT "FK_d487f584890d0ca841b019edce9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_data" DROP CONSTRAINT "FK_d8f96ce11aa334bbb24deb60ff5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" DROP CONSTRAINT "FK_36b80835c3accfc6e0e304d9685"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_targets" DROP CONSTRAINT "FK_2d7c9813e7015ffa0cf8a7fbde9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_26c45eda03eca4d4c996bd99514"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_584712a629194dfe983bb9bd262"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_17af56e7e356bda9d3c6d26de6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msnp_indicator_configurations" DROP CONSTRAINT "FK_06c6c1bd78394bb710e8ea6543f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`,
    );
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "administrative_levels"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_62408b952557958fd12867cfeb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8769d5d852a6b56dd77186a1c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd2726fd31b35443f2245b93ba"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    await queryRunner.query(`DROP TABLE "age_groups"`);
    await queryRunner.query(`DROP TABLE "genders"`);
    await queryRunner.query(`DROP TABLE "frequencies"`);
    await queryRunner.query(`DROP TABLE "msnp_indicator_data"`);
    await queryRunner.query(`DROP TABLE "msnp_indicator_targets"`);
    await queryRunner.query(`DROP TABLE "fiscal_years"`);
    await queryRunner.query(`DROP TABLE "msnp_indicator_configurations"`);
    await queryRunner.query(`DROP TABLE "msnp_indicators"`);
    await queryRunner.query(`DROP TABLE "sectors"`);
    await queryRunner.query(`DROP TABLE "types"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_system_role_enum"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7331684c0c5b063803a425001a"`,
    );
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
