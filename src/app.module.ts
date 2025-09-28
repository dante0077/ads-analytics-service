import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from 'config/postgres.config';
import { AppController } from 'api/app/app.controller';
import { RedisModule } from 'common/redis/redis.module';
import { AppService } from 'services/app.service';
import { V1Module } from 'api/v1/v1.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    TypeOrmModule.forRootAsync({
      useFactory: () => DatabaseConfig.getTypeOrmConfig(),
    }),
    RedisModule,
    V1Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
