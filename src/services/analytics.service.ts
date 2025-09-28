import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analytics } from '../models/entities/analytics.entity';
import { Project } from '../models/entities/project.entity';
import { CreateAnalyticsDto } from '../api/v1/analytics/dto/create-analytics.dto';
import { AnalyticsResponseDto } from '../api/v1/analytics/dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async createAnalyticsEvent(
    createAnalyticsDto: CreateAnalyticsDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AnalyticsResponseDto> {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: String(createAnalyticsDto.projectId) },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${createAnalyticsDto.projectId} not found`,
      );
    }

    // Create analytics event
    const analyticsEvent = this.analyticsRepository.create({
      project_id: createAnalyticsDto.projectId,
      event_type: createAnalyticsDto.eventType,
    });

    const savedEvent = await this.analyticsRepository.save(analyticsEvent);

    return {
      id: savedEvent.id,
      projectId: savedEvent.project_id,
      eventType: savedEvent.event_type,
      createdAt: savedEvent.created_at,
    };
  }

  async getAnalyticsByProjectId(
    projectId: number,
  ): Promise<AnalyticsResponseDto[]> {
    const events = await this.analyticsRepository.find({
      where: { project_id: projectId },
      order: { created_at: 'DESC' },
    });

    return events.map(event => ({
      id: event.id,
      projectId: event.project_id,
      eventType: event.event_type,
      createdAt: event.created_at,
    }));
  }

  async getAnalyticsByProjectIdAndEventType(
    projectId: number,
    eventType: string,
  ): Promise<AnalyticsResponseDto[]> {
    const events = await this.analyticsRepository.find({
      where: {
        project_id: projectId,
        event_type: eventType,
      },
      order: { created_at: 'DESC' },
    });

    return events.map(event => ({
      id: event.id,
      projectId: event.project_id,
      eventType: event.event_type,
      createdAt: event.created_at,
    }));
  }

  async getAnalyticsStats(projectId: number): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    lastEventAt?: Date;
  }> {
    const events = await this.analyticsRepository.find({
      where: { project_id: projectId },
      order: { created_at: 'DESC' },
    });

    const eventsByType: Record<string, number> = {};
    let lastEventAt: Date | undefined;

    events.forEach(event => {
      eventsByType[event.event_type] =
        (eventsByType[event.event_type] || 0) + 1;
      if (!lastEventAt || event.created_at > lastEventAt) {
        lastEventAt = event.created_at;
      }
    });

    return {
      totalEvents: events.length,
      eventsByType,
      lastEventAt,
    };
  }
}
