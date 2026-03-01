import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // needed for Stripe webhook signature verification
  });

  // ── Security headers ──────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // configured at CDN level
  }));

  // ── Static file serving ───────────────────────────────────────────────────────
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  // ── Health + readiness probes (outside /api prefix for Docker/LB) ─────────────
  const http = app.getHttpAdapter().getInstance() as import('express').Express;

  http.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
  });

  http.get('/ready', async (_req, res) => {
    try {
      // Lightweight DB ping via Prisma
      const { PrismaService } = await import('./prisma/prisma.service');
      const prisma = app.get(PrismaService);
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready', db: 'ok', timestamp: new Date().toISOString() });
    } catch (e: any) {
      res.status(503).json({ status: 'not ready', db: 'error', error: e.message });
    }
  });

  // ── WebSocket ─────────────────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── CORS — tight config ────────────────────────────────────────────────────────
  const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature', 'x-moyasar-signature'],
  });

  // ── Global pipes, filters, interceptors ───────────────────────────────────────
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

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mwazn API')
    .setDescription('Production-ready B2B Marketplace API — Saudi Arabia')
    .setVersion('2.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth').addTag('Companies').addTag('Categories')
    .addTag('Listings').addTag('RFQs').addTag('Quotes')
    .addTag('Deals').addTag('Ratings').addTag('Conversations')
    .addTag('Admin').addTag('Upload').addTag('Billing')
    .addTag('Verification').addTag('Search & Marketplace')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`Mwazn API  →  http://localhost:${port}/api`);
  logger.log(`Swagger    →  http://localhost:${port}/api/docs`);
  logger.log(`Health     →  http://localhost:${port}/health`);
  logger.log(`Ready      →  http://localhost:${port}/ready`);
}

bootstrap();
