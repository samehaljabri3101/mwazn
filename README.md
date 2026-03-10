# Mwazn | موازن

Saudi B2B Procurement Marketplace — connecting verified suppliers with buyers.

[![CI](https://github.com/samehaljabri3101/mwazn/actions/workflows/ci.yml/badge.svg)](https://github.com/samehaljabri3101/mwazn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + next-intl (AR/EN) |
| Backend | NestJS 10 + Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (access 15m / refresh 7d) + bcrypt |
| Real-time | Socket.io |
| Payments | Moyasar (stub until `MOYASAR_SECRET_KEY` is set) |
| E-invoicing | ZATCA Phase 2 (local XML until `ZATCA_API_KEY` is set) |
| CR Validation | Maroof API (format-only until `MAROOF_API_KEY` is set) |

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/samehaljabri3101/mwazn.git && cd mwazn

# 2. Configure environment
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# Edit both files — set JWT secrets, SMTP, etc.

# 3. Build and start all services
docker compose up -d --build

# 4. Seed demo data (optional)
docker compose exec backend npm run seed
```

Services:
- Frontend → http://localhost:3000
- Backend API → http://localhost:3001/api
- Swagger → http://localhost:3001/api/docs
- Health check → http://localhost:3001/health

---

## Local Development

**Prerequisites**: Node.js 20+, PostgreSQL 16 (or Docker for DB only)

```bash
# Start just the database
docker compose up -d db

# Backend
cd apps/backend
cp .env.example .env        # edit DATABASE_URL and JWT secrets
npm ci
npx prisma migrate dev
npm run seed                # optional demo data
npm run start:dev           # http://localhost:3001

# Frontend (new terminal)
cd apps/frontend
cp .env.example .env        # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm ci
npm run dev                 # http://localhost:3000
```

---

## Database Migrations

```bash
# Create a new migration (dev only)
cd apps/backend
npx prisma migrate dev --name describe_your_change

# Apply migrations in production
npx prisma migrate deploy

# Reset dev database and reseed (NEVER in production)
./scripts/reset-dev.sh
```

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | **Change in production** |
| `JWT_REFRESH_SECRET` | Yes | **Change in production** |
| `JWT_ACCESS_EXPIRES` | No | Default: `15m` |
| `JWT_REFRESH_EXPIRES` | No | Default: `7d` |
| `FRONTEND_URL` | Yes | For CORS (e.g. `https://mwazn.sa`) |
| `EMAIL_MODE` | No | `log` (dev) or `smtp` (prod) |
| `SMTP_HOST/PORT/USER/PASS` | If smtp | SMTP credentials |
| `MOYASAR_SECRET_KEY` | No | Stub mode when empty |
| `ZATCA_API_KEY` | No | Local XML when empty |
| `MAROOF_API_KEY` | No | Format-only when empty |
| `SEED_ADMIN_EMAIL` | No | Seed admin email |
| `SEED_ADMIN_PASSWORD` | No | Seed admin password |

### Frontend (`apps/frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |

---

## Production Deployment

> **Security note:** `docker-compose.yml` includes hardcoded dev-only JWT secrets. Replace them before any production deployment.

1. Generate strong secrets and set them as environment variables or Docker secrets — never commit real secrets to the repository:
   ```bash
   openssl rand -hex 32   # run twice — one for JWT_ACCESS_SECRET, one for JWT_REFRESH_SECRET
   ```
2. Set `NODE_ENV=production`
3. Set `FRONTEND_URL` to your actual domain
4. Set `EMAIL_MODE=smtp` with real SMTP credentials
5. Run `docker compose up -d --build`
6. Migrations and seed run automatically on container start

---

## Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mwazn.sa | Admin@1234 |
| Buyer | admin@buyer1.sa | Buyer@1234 |
| Supplier (PRO) | admin@supplier1.sa | Supplier@1234 |
| Supplier (FREE) | admin@supplier3.sa | Supplier@1234 |

> Credentials are configurable via `SEED_ADMIN_PASSWORD`, `SEED_SUP_PASSWORD`, `SEED_BUY_PASSWORD` env vars.

---

## Project Structure

```
mwazn/
├── apps/
│   ├── backend/        # NestJS API (22 modules)
│   │   ├── prisma/     # Schema, migrations, seed
│   │   ├── src/        # Application source
│   │   └── scripts/    # Dev utilities
│   └── frontend/       # Next.js (AR/EN bilingual)
├── .github/workflows/  # CI pipeline
├── infra/              # Infrastructure configs
└── docs/               # Project documentation
```

---

## CI

GitHub Actions runs on every push to `main`/`develop`:
- Typecheck + build backend
- Prisma schema validation
- Lint backend + frontend
- Next.js production build
- Docker image smoke build

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
