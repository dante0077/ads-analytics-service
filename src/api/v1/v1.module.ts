import { Module } from '@nestjs/common';
import { ProjectsModule } from './project/projects.module';
import { AssetsModule } from './assets/dto/assets.module';
import { JobsModule } from './jobs/jobs.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [ProjectsModule, AssetsModule, JobsModule, AnalyticsModule],
})
export class V1Module {}
