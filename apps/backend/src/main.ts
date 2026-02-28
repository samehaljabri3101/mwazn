import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // Serve uploaded files statically
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  // Health check endpoint — excluded from global prefix for Docker/load-balancer probes
  const httpAdapter = app.getHttpAdapter().getInstance() as import('express').Express;
  httpAdapter.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mwazn API')
    .setDescription('Production-ready B2B Marketplace API — Saudi Arabia')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth', 'Authentication & registration')
    .addTag('Companies', 'Company management')
    .addTag('Categories', 'Product categories')
    .addTag('Listings', 'Supplier product listings')
    .addTag('RFQs', 'Request for Quotations')
    .addTag('Quotes', 'Supplier quotations')
    .addTag('Deals', 'Deal lifecycle')
    .addTag('Ratings', 'Supplier ratings & reviews')
    .addTag('Conversations', 'Internal messaging')
    .addTag('Admin', 'Platform administration')
    .addTag('Upload', 'File uploads')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Mwazn API  →  http://localhost:${port}/api`);
  logger.log(`Swagger    →  http://localhost:${port}/api/docs`);
}

bootstrap();
