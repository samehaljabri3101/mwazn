#!/bin/sh
set -e

# ── Pre-flight checks ──────────────────────────────────────────────────────────
# Warn if required env vars are still set to known dev-only placeholder values.
# These checks do NOT block startup (to keep local dev simple), but emit clear
# warnings so operators know what must change before going to production.

if [ -z "$JWT_ACCESS_SECRET" ]; then
  echo "WARNING: JWT_ACCESS_SECRET is not set. Using insecure default — NOT safe for production."
fi

if [ "$JWT_ACCESS_SECRET" = "mwazn_jwt_access_secret_docker_2026" ]; then
  echo "WARNING: JWT_ACCESS_SECRET is still the docker-compose dev default. Change it before production deployment."
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Cannot start." >&2
  exit 1
fi

if [ "$NODE_ENV" = "production" ] && [ -z "$FRONTEND_URL" ]; then
  echo "WARNING: FRONTEND_URL is not set in production mode. Email links will be broken."
fi

# ── Database migrations ────────────────────────────────────────────────────────
echo "==> Running Prisma migrations..."
npx prisma migrate deploy

# ── Seed (idempotent — skips if data already exists) ──────────────────────────
echo "==> Seeding database..."
if node prisma/seed.js; then
  echo "Seed complete."
else
  echo "Seed skipped or encountered an error (non-fatal — continuing startup)."
fi

# ── Start application ──────────────────────────────────────────────────────────
echo "==> Starting Mwazn backend..."
exec node dist/main
