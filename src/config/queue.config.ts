import { RedisOptions } from 'ioredis';
import { RedisConfig } from './redis.config';

export class QueueConfig {
  static getQueueOptions(): RedisOptions {
    return RedisConfig.getRedisOptions();
  }

  static getQueueName(): string {
    return 'render-queue';
  }

  static getWorkerName(): string {
    return 'render-worker';
  }
}
