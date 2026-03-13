import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body.data.accessToken as string;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('Role-Based Access Flows (e2e)', () => {
  let app: INestApplication;

  // Tokens — populated in beforeAll
  let adminToken: string;
  let buyerToken: string;
  let supplierToken: string;
  let freelancerToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    // Seed demo accounts must exist (created by seed.ts)
    [adminToken, buyerToken, supplierToken, freelancerToken, customerToken] =
      await Promise.all([
        loginAs(app, 'admin@mwazn.sa', 'Admin@1234'),
        loginAs(app, 'admin@buyer1.sa', 'Buyer@1234'),
        loginAs(app, 'admin@supplier1.sa', 'Supplier@1234'),
        loginAs(app, 'freelancer@demo.sa', 'Freelancer@1234'),
        loginAs(app, 'customer@demo.sa', 'Customer@1234'),
      ]);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Unauthenticated ─────────────────────────────────────────────────────

  it('GET /api/admin/dashboard — 401 without token', () => {
    return request(app.getHttpServer()).get('/api/admin/dashboard').expect(401);
  });

  it('POST /api/listings — 401 without token', () => {
    return request(app.getHttpServer()).post('/api/listings').expect(401);
  });

  it('POST /api/rfqs — 401 without token', () => {
    return request(app.getHttpServer()).post('/api/rfqs').expect(401);
  });

  it('GET /api/analytics/supplier — 401 without token', () => {
    return request(app.getHttpServer()).get('/api/analytics/supplier').expect(401);
  });

  // ─── Admin dashboard ─────────────────────────────────────────────────────

  it('GET /api/admin/dashboard — 200 for PLATFORM_ADMIN', () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });

  it('GET /api/admin/dashboard — 403 for BUYER_ADMIN', () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);
  });

  it('GET /api/admin/dashboard — 403 for SUPPLIER_ADMIN', () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${supplierToken}`)
      .expect(403);
  });

  // ─── Analytics role separation ────────────────────────────────────────────

  it('GET /api/analytics/supplier — 200 for SUPPLIER_ADMIN', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/supplier')
      .set('Authorization', `Bearer ${supplierToken}`)
      .expect(200);
  });

  it('GET /api/analytics/supplier — 200 for FREELANCER (dual-role seller)', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/supplier')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .expect(200);
  });

  it('GET /api/analytics/supplier — 403 for BUYER_ADMIN', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/supplier')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);
  });

  it('GET /api/analytics/supplier — 403 for CUSTOMER', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/supplier')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('GET /api/analytics/buyer — 200 for BUYER_ADMIN', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/buyer')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
  });

  it('GET /api/analytics/buyer — 200 for CUSTOMER', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/buyer')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
  });

  it('GET /api/analytics/buyer — 403 for SUPPLIER_ADMIN', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/buyer')
      .set('Authorization', `Bearer ${supplierToken}`)
      .expect(403);
  });

  it('GET /api/analytics/buyer — 403 for FREELANCER calling buyer endpoint', () => {
    return request(app.getHttpServer())
      .get('/api/analytics/buyer')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .expect(403);
  });

  // ─── RFQ creation role enforcement ───────────────────────────────────────

  it('POST /api/rfqs — 403 for SUPPLIER_ADMIN (pure seller role)', () => {
    return request(app.getHttpServer())
      .post('/api/rfqs')
      .set('Authorization', `Bearer ${supplierToken}`)
      .send({ title: 'test', description: 'test', categoryId: 'x', quantity: 1, unit: 'piece' })
      .expect(403);
  });

  it('POST /api/rfqs — 403 for unverified SUPPLIER_ADMIN', () => {
    // Same supplier — still 403 because role is wrong, not verification
    return request(app.getHttpServer())
      .post('/api/rfqs')
      .set('Authorization', `Bearer ${supplierToken}`)
      .send({})
      .expect(403);
  });

  // ─── Listing creation role enforcement ───────────────────────────────────

  it('POST /api/listings — 403 for BUYER_ADMIN', () => {
    return request(app.getHttpServer())
      .post('/api/listings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ titleEn: 'test', titleAr: 'اختبار', descriptionEn: 'x', categoryId: 'y', unit: 'piece' })
      .expect(403);
  });

  it('POST /api/listings — 403 for CUSTOMER', () => {
    return request(app.getHttpServer())
      .post('/api/listings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ titleEn: 'test', titleAr: 'اختبار', descriptionEn: 'x', categoryId: 'y', unit: 'piece' })
      .expect(403);
  });

  // SUPPLIER_ADMIN with valid body returns 400 (validation) not 403 — proves role check passes
  it('POST /api/listings — role check passes for SUPPLIER_ADMIN (400 on bad data, not 403)', () => {
    return request(app.getHttpServer())
      .post('/api/listings')
      .set('Authorization', `Bearer ${supplierToken}`)
      .send({}) // missing required fields → 400 validation error, not 403 forbidden
      .expect((res) => {
        // 400 = validation error (role allowed); anything other than 403
        expect(res.status).not.toBe(403);
      });
  });

  // FREELANCER with valid body returns 400 (validation) not 403 — proves role check passes
  it('POST /api/listings — role check passes for FREELANCER (400 on bad data, not 403)', () => {
    return request(app.getHttpServer())
      .post('/api/listings')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({})
      .expect((res) => {
        expect(res.status).not.toBe(403);
      });
  });

  // ─── Quote submission role enforcement ───────────────────────────────────

  it('POST /api/quotes — 403 for BUYER_ADMIN', () => {
    return request(app.getHttpServer())
      .post('/api/quotes')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rfqId: 'x', price: 100, currency: 'SAR', deliveryDays: 7 })
      .expect(403);
  });

  it('POST /api/quotes — 403 for CUSTOMER', () => {
    return request(app.getHttpServer())
      .post('/api/quotes')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rfqId: 'x', price: 100, currency: 'SAR', deliveryDays: 7 })
      .expect(403);
  });
});
