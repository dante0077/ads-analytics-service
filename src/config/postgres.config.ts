import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export class DatabaseConfig {
  private static getBaseConfig() {
    return {
      type: 'postgres' as const,
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'ads_analytics',
      synchronize: false,
    };
  }

  static getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      ...this.getBaseConfig(),
      autoLoadEntities: true,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      logging: process.env.TYPEORM_LOGGING === 'true',
    } as TypeOrmModuleOptions;
  }

  static getDataSourceOptions(): DataSourceOptions {
    console.log('dir name:', __dirname);
    return {
      ...this.getBaseConfig(),
      entities: ['dist/models/entities/*.entity{.ts,.js}'],
      // migrations: ['dist/database/migrations/*{.ts,.js}'],
      migrations: ['dist/database/migrations/*{.ts,.js}'],
    };
  }

  static createDataSource(): DataSource {
    return new DataSource(this.getDataSourceOptions());
  }
}
