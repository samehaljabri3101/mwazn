# Mwazn Deployment Guide

This guide covers what is needed to move from the current **demo/development** environment to a **production-safe** deployment.

---

## Current State (Demo / Development)

The repository is **production-grade in code quality** but currently configured for demo use:

| Item | Current State | Production Requirement |
|------|--------------|------------------------|
| JWT secrets | Plaintext in `docker-compose.yml` | Inject via environment / Docker secrets |
| Database password | `mwazn` (weak) | Strong random value |
| Seed passwords | Known demo values | Removed or replaced |
| Database | Single local PostgreSQL container | Managed DB (RDS, Supabase, Neon, etc.) |
| File uploads | Local volume (`uploads_data`) | Object storage (S3, Cloudflare R2, etc.) |
| Email | Not configured (`email.service.ts` stub) | SMTP / Sendgrid / AWS SES |
| Payments | Stripe integration scaffolded | Activate + configure webhook secret |
| Domain / TLS | None | HTTPS with valid certificate |
| Monitoring | None | Error tracking (Sentry), uptime monitoring |

---

## Required Before Production Deployment

### 1. Replace all demo secrets

Generate strong values for each secret:
```bash
openssl rand -hex 32   # run once per secret needed
```

Required environment variables (set via `.env` file or secret injection, never in `docker-compose.yml`):
```
POSTGRES_PASSWORD=<strong-random>
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
SEED_ADMIN_PASSWORD=<replace or remove>
SEED_SUP_PASSWORD=<replace or remove>
SEED_BUY_PASSWORD=<replace or remove>
```

### 2. Configure external database

Replace the `db` service in `docker-compose.yml` with connection details for a managed database:
```
DATABASE_URL=postgresql://user:password@host:5432/mwazn
```

Run migrations against the production database **before** starting the application:
```bash
npx prisma migrate deploy
```

### 3. Configure file storage

The current `upload.service.ts` writes files to `/app/uploads` inside the container (mapped to `uploads_data` volume). For production:
- Integrate with S3-compatible storage (AWS S3, Cloudflare R2, MinIO)
- Update `upload.service.ts` to use the storage SDK
- Set `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` in environment

### 4. Configure email

`email.service.ts` is a stub. Before enabling notifications:
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (or use a service like Sendgrid / SES)
- Test email delivery before going live

### 5. Configure HTTPS / reverse proxy

Run the stack behind a reverse proxy (Nginx, Caddy, Cloudflare) that:
- Terminates TLS
- Proxies `:80`/`:443` → frontend on port 3000
- Proxies `/api/*` → backend on port 3001 (or use the frontend's built-in rewrite)

Update `NEXT_PUBLIC_API_URL` and `FRONTEND_URL` to use the production domain.

### 6. Harden docker-compose for production

Create a `docker-compose.prod.yml` override that:
- Removes `ports` exposure for db and redis (access only from within Docker network)
- Sets resource limits
- Uses Docker secrets or environment file injection instead of inline values

---

## Database Migration Workflow

```bash
# 1. Generate a new migration after schema changes
cd apps/backend
npx prisma migrate dev --name describe_your_change

# 2. Review the generated SQL in prisma/migrations/<timestamp>/migration.sql

# 3. Deploy to target environment
npx prisma migrate deploy

# 4. Verify
npx prisma validate
```

> ⚠️ Prisma does not generate automatic rollback scripts.
> For any destructive migration (DROP COLUMN, ALTER TYPE), keep a rollback SQL script alongside the migration file.

---

## Seed Data

The seed is **idempotent** — it checks company count before running and skips if data exists.

```bash
# Trigger a fresh seed (wipes existing data):
docker compose down -v          # removes volumes including postgres_data
docker compose up --build -d    # fresh start with seed

# Check seed ran:
docker compose logs backend | grep -E "seed|Seeded|Skipping"
```

For production: disable or replace the seed with a production data bootstrap script. The demo seed data should never run in production.

---

## Health Checks

The backend exposes two health endpoints:

```bash
GET /health   # Liveness — is the server running?
GET /ready    # Readiness — is the DB and Redis connected?
```

The frontend health check is a simple HTTP 200 on `/`.

Docker Compose wait conditions use these (`condition: service_healthy`).

---

## Environment Variables Reference

### Backend (`apps/backend/.env`)

```env
DATABASE_URL=postgresql://user:password@host:5432/mwazn
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
JWT_ACCESS_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SEED_ADMIN_EMAIL=admin@your-domain.com
SEED_ADMIN_PASSWORD=<strong-password>
```

### Frontend (`apps/frontend/.env`)

```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
API_INTERNAL_URL=http://backend:3001/api   # SSR server-side; use Docker service name
```

---

## Checklist Summary

Run through [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before every deployment.

The minimum checklist for a first production deployment:
- [ ] All secrets replaced with strong random values
- [ ] Production database configured and migrated
- [ ] HTTPS configured
- [ ] Seed data disabled or replaced
- [ ] Email configured (or feature-flagged off)
- [ ] Health checks pass post-deploy
- [ ] Manual smoke test of all 5 role types
