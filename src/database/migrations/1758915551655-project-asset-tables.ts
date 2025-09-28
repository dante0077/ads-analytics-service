import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectAssetTables1758915551655 implements MigrationInterface {
    name = 'ProjectAssetTables1758915551655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assets" ("id" SERIAL NOT NULL, "filename" character varying(255) NOT NULL, "file_path" character varying(500) NOT NULL, "mime_type" character varying(100) NOT NULL, "file_type" character varying(100) NOT NULL, "file_size" bigint NOT NULL, "file_extension" character varying(50), "original_name" character varying(255), "project_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_0e5e8c16a2a04e8549eda87b70c" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_0e5e8c16a2a04e8549eda87b70c"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "assets"`);
    }

}
