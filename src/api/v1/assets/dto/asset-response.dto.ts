import { ApiProperty } from '@nestjs/swagger';

export class AssetResponseDto {
  @ApiProperty({
    description: 'Asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Asset filename',
    example: 'image_1234567890.jpg',
  })
  filename!: string;

  @ApiProperty({
    description: 'Asset file path',
    example: '/uploads/projects/123/image_1234567890.jpg',
  })
  file_path!: string;

  @ApiProperty({
    description: 'Asset MIME type',
    example: 'image/jpeg',
  })
  mime_type!: string;

  @ApiProperty({
    description: 'Asset file size in bytes',
    example: 1024000,
  })
  file_size!: number;

  @ApiProperty({
    description: 'Asset file extension',
    example: 'jpg',
    nullable: true,
  })
  file_extension?: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'my-photo.jpg',
    nullable: true,
  })
  original_name?: string;

  @ApiProperty({
    description: 'Project ID this asset belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  project_id!: string;

  @ApiProperty({
    description: 'Asset creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Asset last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at!: Date;
}
