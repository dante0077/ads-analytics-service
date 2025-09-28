import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export class SwaggerConfig {
  static setupSwagger(app: INestApplication): void {
    const swaggerConfig = this.getSwaggerInfo();

    if (swaggerConfig.enabled) {
      const config = new DocumentBuilder()
        .setTitle(swaggerConfig.title)
        .setDescription(swaggerConfig.description)
        .setVersion(swaggerConfig.version)
        .addTag('health', 'Health check endpoints')
        .addTag('api', 'API endpoints')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(swaggerConfig.path, app, document);
    }
  }

  static getSwaggerInfo() {
    return {
      enabled: process.env.SWAGGER_ENABLED !== 'false',
      path: process.env.SWAGGER_PATH || 'api-docs',
      title: 'Ads Analytics Service',
      description: 'API documentation for Ads Analytics Service',
      version: '1.0.0',
    };
  }
}
