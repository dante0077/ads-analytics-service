import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProjectService } from '../../../services/project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import {
  RenderJobRequestDto,
  RenderJobResponseDto,
} from './dto/render-job.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    try {
      return await this.projectService.createProject(createProjectDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create project',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    type: [ProjectResponseDto],
  })
  async getAllProjects(): Promise<ProjectResponseDto[]> {
    return await this.projectService.findAllProjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async getProjectById(@Param('id') id: string): Promise<ProjectResponseDto> {
    const project = await this.projectService.findProjectById(id);

    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    return project;
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Enqueue a render job for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Render job enqueued successfully',
    type: RenderJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  async enqueueRenderJob(
    @Param('id') id: string,
    @Body() renderJobRequest: RenderJobRequestDto,
  ): Promise<RenderJobResponseDto> {
    try {
      // Verify project exists
      const project = await this.projectService.findProjectById(id);
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }
      // Check if a render job already exists for this project
      const existingJob =
        await this.projectService.findActiveRenderJobByProjectId(id);
      if (existingJob) {
        return {
          jobId: existingJob.id!,
          projectId: id,
          status: existingJob.state,
          createdAt: new Date(),
        };
      }

      // Enqueue render job
      const renderJob = await this.projectService.enqueueRenderJob(
        id,
        renderJobRequest,
      );
      return renderJob;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to enqueue render job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health/queue')
  @ApiOperation({ summary: 'Check render queue health' })
  @ApiResponse({
    status: 200,
    description: 'Queue health status',
  })
  async checkQueueHealth() {
    try {
      const isHealthy = await this.projectService.checkQueueHealth();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: 'Failed to check queue health',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
