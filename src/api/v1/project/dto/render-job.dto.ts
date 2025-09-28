import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class RenderJobRequestDto {
  @ApiProperty({
    description: 'Render job configuration options',
    required: false,
    example: { quality: 'high', format: 'mp4', resolution: '1920x1080' },
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class RenderJobResponseDto {
  @ApiProperty({
    description: 'Unique job ID for tracking the render job',
    example: 'render_job_123456789',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Project ID that the render job belongs to',
    example: '1',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Current status of the render job',
    example: 'queued',
    enum: ['queued', 'processing', 'completed', 'failed'],
  })
  status!: string;

  @ApiProperty({
    description: 'Timestamp when the job was created',
    example: '2024-01-27T10:30:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Estimated completion time in seconds',
    example: 300,
    required: false,
  })
  estimatedDuration?: number;
}
