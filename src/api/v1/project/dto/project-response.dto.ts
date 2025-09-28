import { ApiProperty } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Project title',
    example: 'My Awesome Project',
  })
  title!: string;

  @ApiProperty({
    description: 'Project description',
    example: 'This is a description of my awesome project',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Project creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Project last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt?: Date;
}
