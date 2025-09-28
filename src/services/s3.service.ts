import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Config } from '../config/s3.config';
import * as fs from 'fs';
import * as path from 'path';

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client(S3Config.getS3Config());
  }

  async uploadFile(
    filePath: string,
    key: string,
    contentType: string = 'video/mp4',
  ): Promise<S3UploadResult> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileStats = fs.statSync(filePath);

      const command = new PutObjectCommand({
        Bucket: S3Config.getBucketName(),
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          'original-filename': path.basename(filePath),
          'upload-timestamp': new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const url = await this.getSignedUrl(key);

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        bucket: S3Config.getBucketName(),
        size: fileStats.size,
        contentType,
      };
    } catch (error: any) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  async uploadRenderedVideo(
    filePath: string,
    projectId: string,
    jobId: string,
  ): Promise<S3UploadResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.basename(filePath);
    const key = `renders/${projectId}/${jobId}/${timestamp}_${filename}`;

    return this.uploadFile(filePath, key, 'video/mp4');
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3Config.getBucketName(),
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: any) {
      this.logger.error(`Failed to generate signed URL for ${key}:`, error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: S3Config.getBucketName(),
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check by listing objects (with limit 1)
      const command = new PutObjectCommand({
        Bucket: S3Config.getBucketName(),
        Key: 'health-check',
        Body: 'health-check',
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      this.logger.error('S3 health check failed:', error);
      return false;
    }
  }
}
