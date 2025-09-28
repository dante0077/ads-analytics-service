import { MigrationInterface, QueryRunner } from "typeorm";

export class AnalyticsTable1758922383848 implements MigrationInterface {
    name = 'AnalyticsTable1758922383848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "analytics" ("id" SERIAL NOT NULL, "event_type" character varying(255) NOT NULL, "project_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3c96dcbf1e4c57ea9e0c3144bff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "analytics" ADD CONSTRAINT "FK_7837106f17edec655a4163f1a97" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "analytics" DROP CONSTRAINT "FK_7837106f17edec655a4163f1a97"`);
        await queryRunner.query(`DROP TABLE "analytics"`);
    }

}
