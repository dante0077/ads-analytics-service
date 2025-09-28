import { Worker, Job } from 'bullmq';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueConfig } from '../config/queue.config';
import { Asset } from '../models/entities/asset.entity';
import { S3Service } from '../services/s3.service';

interface RenderJobData {
  projectId: string;
  options: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class RenderWorker {
  private worker: Worker;
  private readonly outputDir: string;
  private readonly logger = new Logger(RenderWorker.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly s3Service: S3Service,
  ) {
    // Use container-local temp folder
    this.outputDir = path.resolve('/tmp/outputs');
    this.ensureDirectoryExists(this.outputDir);
  
    this.worker = new Worker(
      QueueConfig.getQueueName(),
      this.processRenderJob.bind(this),
      {
        connection: {
          ...QueueConfig.getQueueOptions(),
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
        },
        concurrency: 2,
      },
    );
  
    this.setupEventHandlers();
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', job =>
      this.logger.log(`Render job ${job.id} completed successfully`),
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`Render job ${job?.id} failed: ${err.message}`),
    );
    this.worker.on('error', err => this.logger.error('Worker error:', err));
    this.worker.on('ready', () =>
      this.logger.log('Render worker is ready and waiting for jobs'),
    );
  }

  private async processRenderJob(job: Job<RenderJobData>): Promise<any> {
    const { projectId, options } = job.data;
    const jobId = String(job.id);
    this.logger.log(`Processing render job ${jobId} for project ${projectId}`);

    try {
      await this.safeUpdateProgress(job, 10);

      const sourceAsset = await this.getFirstVideoAsset(projectId);
      const sourceVideoPath = path.resolve(
        process.cwd(),
        sourceAsset.file_path,
      );
      this.ensureFileExists(sourceVideoPath);

      await this.safeUpdateProgress(job, 20);

      const projectOutputDir = path.join(this.outputDir, projectId);
      this.ensureDirectoryExists(projectOutputDir);

      await this.safeUpdateProgress(job, 30);

      const outputPath = await this.renderVideoWithFFmpeg(
        sourceVideoPath,
        projectOutputDir,
        options,
        job,
      );

      await this.safeUpdateProgress(job, 90);

      // Verify local file was saved successfully
      let localSaveSuccess = false;
      let localSaveError = null;
      let fileStats = null;

      try {
        if (fs.existsSync(outputPath)) {
          fileStats = fs.statSync(outputPath);
          localSaveSuccess = true;
          this.logger.log(`Local file saved successfully: ${outputPath}`);
        } else {
          throw new Error('Local file was not created');
        }
      } catch (error: any) {
        localSaveError = error.message;
        this.logger.warn(
          `Local file save verification failed: ${localSaveError}`,
        );
      }

      const metadata = {
        filename: path.basename(outputPath),
        path: outputPath,
        size: fileStats?.size || 0,
        createdAt: fileStats?.birthtime || new Date(),
        projectId,
        jobId,
        sourceAsset: {
          id: sourceAsset.id,
          filename: sourceAsset.filename,
          originalPath: sourceAsset.file_path,
        },
        options,
        localSaveSuccess,
        localSaveError,
      };

      await this.safeUpdateProgress(job, 95);

      // Try to upload to S3 (optional - local save already succeeded)
      let s3Result = null;
      let s3Error = null;

      try {
        this.logger.log(`Uploading rendered video to S3: ${outputPath}`);
        s3Result = await this.s3Service.uploadRenderedVideo(
          outputPath,
          projectId,
          jobId,
        );
        this.logger.log(`S3 upload successful: ${s3Result.url}`);
      } catch (error: any) {
        s3Error = error.message;
        this.logger.warn(`S3 upload failed: ${s3Error}`);
      }

      await this.safeUpdateProgress(job, 100);

      // Determine success message based on what worked
      let successMessage = 'Video rendered successfully';
      let overallSuccess = false;

      if (localSaveSuccess && s3Result) {
        successMessage =
          'Video rendered and saved to both local storage and S3 successfully';
        overallSuccess = true;
      } else if (localSaveSuccess && !s3Result) {
        successMessage = 'Video rendered and saved locally (S3 upload failed)';
        overallSuccess = true;
      } else if (!localSaveSuccess && s3Result) {
        successMessage =
          'Video rendered and uploaded to S3 (local save failed)';
        overallSuccess = true;
      } else {
        successMessage =
          'Video rendered but both local save and S3 upload failed';
        overallSuccess = false;
      }

      this.logger.log(
        `Render job ${jobId} completed. Local: ${localSaveSuccess ? '✓' : '✗'}, S3: ${s3Result ? '✓' : '✗'}`,
      );

      if (!overallSuccess) {
        throw new Error(
          'Video rendering completed but failed to save to any storage location',
        );
      }

      return {
        success: overallSuccess,
        outputPath: localSaveSuccess ? outputPath : null,
        s3Result,
        s3Error,
        localSaveSuccess,
        localSaveError,
        metadata: {
          ...metadata,
          s3Key: s3Result?.key,
          s3Url: s3Result?.url,
          s3Bucket: s3Result?.bucket,
        },
        message: successMessage,
      };
    } catch (error: any) {
      this.logger.error(`Render job ${jobId} failed:`, error.stack || error);
      throw error;
    }
  }

  private async safeUpdateProgress(job: Job, progress: number): Promise<void> {
    try {
      await Promise.race([
        job.updateProgress(progress),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Progress update timeout')), 1000),
        ),
      ]);
    } catch (error: any) {
      this.logger.warn(
        `Failed to update progress for job ${job.id}: ${error.message}`,
      );
    }
  }

  private ensureFileExists(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  private async getFirstVideoAsset(projectId: string): Promise<Asset> {
    const videoAssets = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.project_id = :projectId', { projectId })
      .andWhere('asset.file_type = :fileType', { fileType: 'video' })
      .getMany();

    const validAsset = videoAssets.find(asset =>
      RenderWorker.allowedVideoExtensions().includes(
        path.extname(asset.filename).toLowerCase(),
      ),
    );

    if (!validAsset) {
      throw new Error(`No video assets found for project ${projectId}`);
    }

    return validAsset;
  }

  private static allowedVideoExtensions(): string[] {
    return ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];
  }

  private getFontFilePath(): string {
    if (process.platform === 'darwin')
      return '/System/Library/Fonts/Supplemental/Arial.ttf';
    if (process.platform === 'win32') return 'C:\\Windows\\Fonts\\arial.ttf';
    return '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  }

  private buildFfmpegOptions(options: Record<string, any>) {
    let crf = '28';
    let size = '854x480';

    return { crf, size };
  }

  private async renderVideoWithFFmpeg(
    inputVideoPath: string,
    outputDir: string,
    options: Record<string, any>,
    job: Job<RenderJobData>,
  ): Promise<string> {
    this.ensureDirectoryExists(outputDir);
    const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFilename = `render_${job.id}_${safeTimestamp}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    const fontFile = this.getFontFilePath();
    if (!fs.existsSync(fontFile)) {
      this.logger.warn(`Font file not found: ${fontFile}. Drawtext may fail.`);
    }

    // Double-check parent dir exists (important in Docker)
    this.ensureDirectoryExists(path.dirname(outputPath));

    const overlayText = `Project Render - ${safeTimestamp}`;
    const ffmpegOpts = this.buildFfmpegOptions(options);

    return new Promise((resolve, reject) => {
      console.log('REACHED HERE', outputPath);
      ffmpeg(inputVideoPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset fast', `-crf ${ffmpegOpts.crf}`])
        .size(ffmpegOpts.size)
        .videoFilters([
          `drawtext=fontfile='${fontFile}':text='${overlayText}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.5:boxborderw=5`,
        ])
        .on('start', cmdLine => this.logger.log('FFmpeg started:', cmdLine))
        .on('progress', async progress => {
          const renderProgress = 30 + (progress.percent ?? 0) * 0.5;
          await this.safeUpdateProgress(job, Math.min(renderProgress, 80));
        })
        .on('end', () => {
          this.logger.log(`FFmpeg completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', err => {
          this.logger.error('FFmpeg error:', err.message);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
