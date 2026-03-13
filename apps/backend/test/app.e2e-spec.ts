import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('Mwazn API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/categories — returns categories array', () => {
    return request(app.getHttpServer())
      .get('/api/categories')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('POST /api/auth/login — rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPass1!' })
      .expect(401);
  });

  it('GET /api/rfqs — returns open RFQs', () => {
    return request(app.getHttpServer())
      .get('/api/rfqs')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data).toHaveProperty('meta');
      });
  });

  it('GET /api/listings — returns marketplace listings', () => {
    return request(app.getHttpServer())
      .get('/api/listings')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });

  it('GET /api/admin/dashboard — requires auth', () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .expect(401);
  });

  it('GET /api/marketplace/stats — returns marketplace stats', () => {
    return request(app.getHttpServer())
      .get('/api/marketplace/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalVendors');
        expect(res.body.data).toHaveProperty('totalProducts');
        expect(res.body.data).toHaveProperty('totalRFQs');
      });
  });

  it('GET /api/suppliers/search — returns paginated supplier results', () => {
    return request(app.getHttpServer())
      .get('/api/suppliers/search')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data).toHaveProperty('total');
        expect(res.body.data).toHaveProperty('pages');
      });
  });

  it('GET /api/suppliers/search — returns paginated listing results', () => {
    return request(app.getHttpServer())
      .get('/api/suppliers/search')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data).toHaveProperty('total');
      });
  });

  it('GET /api/search?q=industrial — returns search results', () => {
    return request(app.getHttpServer())
      .get('/api/search?q=industrial')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('companies');
        expect(res.body.data).toHaveProperty('listings');
        expect(res.body.data).toHaveProperty('categories');
      });
  });

  it('GET /api/marketplace/top-vendors — returns vendor list', () => {
    return request(app.getHttpServer())
      .get('/api/marketplace/top-vendors')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
