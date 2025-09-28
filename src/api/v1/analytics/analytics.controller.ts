import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AnalyticsService } from '../../../services/analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @ApiOperation({ summary: 'Log an analytics event' })
  @ApiResponse({
    status: 201,
    description: 'Analytics event logged successfully',
    type: AnalyticsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async logEvent(
    @Body() createAnalyticsDto: CreateAnalyticsDto,
    @Req() request: Request,
  ): Promise<AnalyticsResponseDto> {
    try {
      const ipAddress = request.ip || request.connection.remoteAddress;
      const userAgent = request.get('User-Agent');

      return await this.analyticsService.createAnalyticsEvent(
        createAnalyticsDto,
        ipAddress,
        userAgent,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to log analytics event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get analytics events for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Analytics events retrieved successfully',
    type: [AnalyticsResponseDto],
  })
  async getProjectAnalytics(
    @Param('projectId') projectId: string,
  ): Promise<AnalyticsResponseDto[]> {
    try {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) {
        throw new HttpException('Invalid project ID', HttpStatus.BAD_REQUEST);
      }

      return await this.analyticsService.getAnalyticsByProjectId(projectIdNum);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve analytics events',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Get('project/:projectId/stats')
  // @ApiOperation({ summary: 'Get analytics statistics for a project' })
  // @ApiParam({ name: 'projectId', description: 'Project ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Analytics statistics retrieved successfully',
  // })
  // async getProjectAnalyticsStats(
  //   @Param('projectId') projectId: string,
  // ): Promise<{
  //   totalEvents: number;
  //   eventsByType: Record<string, number>;
  //   lastEventAt?: Date;
  // }> {
  //   try {
  //     const projectIdNum = parseInt(projectId, 10);
  //     if (isNaN(projectIdNum)) {
  //       throw new HttpException('Invalid project ID', HttpStatus.BAD_REQUEST);
  //     }

  //     return await this.analyticsService.getAnalyticsStats(projectIdNum);
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       'Failed to retrieve analytics statistics',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Get('project/:projectId/events/:eventType')
  // @ApiOperation({ summary: 'Get analytics events by type for a project' })
  // @ApiParam({ name: 'projectId', description: 'Project ID' })
  // @ApiParam({ name: 'eventType', description: 'Event type' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Analytics events retrieved successfully',
  //   type: [AnalyticsResponseDto],
  // })
  // async getProjectAnalyticsByEventType(
  //   @Param('projectId') projectId: string,
  //   @Param('eventType') eventType: string,
  // ): Promise<AnalyticsResponseDto[]> {
  //   try {
  //     const projectIdNum = parseInt(projectId, 10);
  //     if (isNaN(projectIdNum)) {
  //       throw new HttpException('Invalid project ID', HttpStatus.BAD_REQUEST);
  //     }

  //     return await this.analyticsService.getAnalyticsByProjectIdAndEventType(
  //       projectIdNum,
  //       eventType,
  //     );
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       'Failed to retrieve analytics events',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
