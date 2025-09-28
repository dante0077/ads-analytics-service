import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from '../../../services/analytics.service';
import { Analytics } from '../../../models/entities/analytics.entity';
import { Project } from '../../../models/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Analytics, Project])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
