import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../models/entities/project.entity';
import { CreateProjectDto } from '../api/v1/project/dto/create-project.dto';
import { ProjectResponseDto } from '../api/v1/project/dto/project-response.dto';
import {
  RenderJobRequestDto,
  RenderJobResponseDto,
} from '../api/v1/project/dto/render-job.dto';
import { RenderQueue } from '../queue/render.queue';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async createProject(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = this.projectRepository.create(createProjectDto);
    const savedProject = await this.projectRepository.save(project);

    return {
      id: savedProject.id,
      title: savedProject.title,
      description: savedProject.description,
    };
  }

  async findAllProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.find({
      order: { created_at: 'DESC' },
    });

    return projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    }));
  }

  async findProjectById(id: string): Promise<ProjectResponseDto | null> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      return null;
    }

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };
  }

  async enqueueRenderJob(
    projectId: string,
    renderJobRequest: RenderJobRequestDto,
  ): Promise<RenderJobResponseDto> {
    // Add job to BullMQ queue (non-blocking with timeout)
    const jobId = await RenderQueue.addRenderJob(
      projectId,
      renderJobRequest.options,
    );

    // Always return immediately - job processing happens in background
    return {
      jobId,
      projectId,
      status: 'queued',
      createdAt: new Date(),
      estimatedDuration: this.calculateEstimatedDuration(
        renderJobRequest.options,
      ),
    };
  }

  async findActiveRenderJobByProjectId(projectId: string) {
    return await RenderQueue.findActiveJobByProjectId(projectId);
  }

  async checkQueueHealth(): Promise<boolean> {
    return await RenderQueue.isHealthy();
  }

  private calculateEstimatedDuration(options?: Record<string, any>): number {
    // Basic estimation based on options
    let baseDuration = 300; // 5 minutes base

    if (options?.quality === 'high') {
      baseDuration *= 1.5;
    } else if (options?.quality === 'low') {
      baseDuration *= 0.5;
    }

    if (options?.resolution) {
      const resolution = options.resolution;
      if (resolution.includes('4K') || resolution.includes('3840')) {
        baseDuration *= 2;
      } else if (resolution.includes('1080')) {
        baseDuration *= 1.2;
      }
    }

    return Math.round(baseDuration);
  }
}
