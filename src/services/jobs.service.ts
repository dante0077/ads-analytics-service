import { Injectable } from '@nestjs/common';
import { RenderQueue } from '../queue/render.queue';

type SimplifiedStatus = 'pending' | 'processing' | 'done' | 'failed';

@Injectable()
export class JobsService {
  async getJobStatus(jobId: string) {
    const job = await RenderQueue.getJobStatus(jobId);

    if (!job) {
      return null;
    }

    const simplifiedStatus = this.mapStateToSimplifiedStatus(job.state);

    return {
      jobId: job.id,
      status: simplifiedStatus as SimplifiedStatus,
      state: job.state,
      progress: job.progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  private mapStateToSimplifiedStatus(state: string): SimplifiedStatus {
    switch (state) {
      case 'waiting':
      case 'waiting-children':
      case 'delayed':
        return 'pending';
      case 'active':
        return 'processing';
      case 'completed':
        return 'done';
      case 'failed':
      case 'stalled':
      default:
        return 'failed';
    }
  }
}
