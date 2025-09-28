import { RedisOptions } from 'ioredis';

export class RedisConfig {
  static getRedisOptions(): RedisOptions {
    return {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB || 0),
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    };
  }

  static getConnectionString(): string {
    const options = this.getRedisOptions();
    const auth = options.password ? `:${options.password}@` : '';
    return `redis://${auth}${options.host}:${options.port}/${options.db}`;
  }
}
