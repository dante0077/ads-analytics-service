import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../../../models/entities/project.entity';
import { ProjectService } from '../../../services/project.service';
import { ProjectsController } from './projects.controller';
import { Asset } from 'models/entities/asset.entity';
import { QueueModule } from '../../../queue/queue.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Asset]), QueueModule],
  controllers: [ProjectsController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectsModule {}
