import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export class UploadAssetDto {
  @ApiProperty({
    description: 'Asset type',
    enum: AssetType,
    example: AssetType.IMAGE,
  })
  @IsEnum(AssetType)
  type!: AssetType;

  @ApiProperty({
    description: 'Original filename',
    example: 'my-photo.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  original_name?: string;
}
