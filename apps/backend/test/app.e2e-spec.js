"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('Mwazn API (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
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
});
//# sourceMappingURL=app.e2e-spec.js.map