import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RenderWorker } from '../workers/render.worker';
import { Asset } from '../models/entities/asset.entity';
import { S3Service } from '../services/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asset])],
  providers: [RenderWorker, S3Service],
  exports: [RenderWorker, S3Service],
})
export class QueueModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly renderWorker: RenderWorker) {}

  async onModuleInit() {
    console.log('Queue module initialized');
  }

  async onModuleDestroy() {
    await this.renderWorker.close();
    console.log('Queue module destroyed');
  }
}
