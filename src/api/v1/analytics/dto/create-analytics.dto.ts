import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateAnalyticsDto {
  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  projectId!: number;

  @ApiProperty({
    description: 'Event type',
    example: 'play',
    enum: ['play', 'click', 'impression', 'pause', 'complete', 'skip'],
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventType!: string;
}
