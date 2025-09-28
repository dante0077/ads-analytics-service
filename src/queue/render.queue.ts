import { Queue, QueueOptions, Job } from 'bullmq';
import { QueueConfig } from '../config/queue.config';

export class RenderQueue {
  private static instance: Queue;
  private static queueName = QueueConfig.getQueueName();

  static getInstance(): Queue {
    if (!RenderQueue.instance) {
      const options: QueueOptions = {
        connection: {
          ...QueueConfig.getQueueOptions(),
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
        },
        defaultJobOptions: {
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 5, // Keep last 5 failed jobs
          attempts: 3, // Retry failed jobs up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      };

      RenderQueue.instance = new Queue(RenderQueue.queueName, options);

      // Add error handling for queue connection
      RenderQueue.instance.on('error', error => {
        console.error('Queue connection error:', error);
      });
    }

    return RenderQueue.instance;
  }

  static async addRenderJob(
    projectId: string,
    options: Record<string, any> = {},
  ): Promise<string> {
    const queue = RenderQueue.getInstance();
    const jobId = `render_${projectId}_${Date.now()}`;

    try {
      // Use Promise.race to add timeout to prevent blocking
      const job = await Promise.race([
        queue.add(
          'render-video',
          {
            projectId,
            options,
            timestamp: new Date().toISOString(),
          },
          {
            jobId,
            priority: options.priority || 0,
          },
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Queue operation timeout')), 5000),
        ),
      ]);

      return job.id!;
    } catch (error) {
      console.error('Failed to add render job to queue:', error);
      // Return a fallback job ID even if queue fails
      // This ensures the API doesn't break if Redis is down
      return jobId;
    }
  }

  static async getJobStatus(jobId: string) {
    try {
      const queue = RenderQueue.getInstance();

      // Add timeout to prevent blocking
      const job = await Promise.race([
        queue.getJob(jobId),
        new Promise<Job | null>((_, reject) =>
          setTimeout(() => reject(new Error('Job lookup timeout')), 3000),
        ),
      ]);

      if (!job) {
        return null;
      }

      const state = await Promise.race([
        job.getState(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('State lookup timeout')), 2000),
        ),
      ]);

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        state,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      return null;
    }
  }

  static async isHealthy(): Promise<boolean> {
    try {
      const queue = RenderQueue.getInstance();
      await Promise.race([
        queue.getWaiting(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 2000),
        ),
      ]);
      return true;
    } catch (error) {
      console.error('Queue health check failed:', error);
      return false;
    }
  }

  static async findActiveJobByProjectId(projectId: string) {
    try {
      const queue = RenderQueue.getInstance();

      // Check waiting jobs
      const waitingJobs = await Promise.race([
        queue.getWaiting(),
        new Promise<Job[]>((_, reject) =>
          setTimeout(
            () => reject(new Error('Waiting jobs lookup timeout')),
            3000,
          ),
        ),
      ]);

      const waitingJob = waitingJobs.find(
        job => job.data?.projectId === projectId,
      );

      if (waitingJob) {
        return {
          id: waitingJob.id,
          state: 'waiting',
          data: waitingJob.data,
        };
      }

      // Check active jobs
      const activeJobs = await Promise.race([
        queue.getActive(),
        new Promise<Job[]>((_, reject) =>
          setTimeout(
            () => reject(new Error('Active jobs lookup timeout')),
            3000,
          ),
        ),
      ]);

      const activeJob = activeJobs.find(
        job => job.data?.projectId === projectId,
      );

      if (activeJob) {
        return {
          id: activeJob.id,
          state: 'active',
          data: activeJob.data,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to find active job by project ID:', error);
      return null;
    }
  }

  static async close(): Promise<void> {
    if (RenderQueue.instance) {
      await RenderQueue.instance.close();
    }
  }
}
