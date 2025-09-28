import './polyfills';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppConfig } from './config/app.config';
import { SwaggerConfig } from './config/swagger.config';
import { AppModule } from 'app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = AppConfig.getPort();

  // Setup Swagger documentation
  SwaggerConfig.setupSwagger(app);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
