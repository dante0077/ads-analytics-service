import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsResponseDto {
  @ApiProperty({
    description: 'Analytics event ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  projectId!: number;

  @ApiProperty({
    description: 'Event type',
    example: 'play',
  })
  eventType!: string;

  @ApiProperty({
    description: 'Event creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}
