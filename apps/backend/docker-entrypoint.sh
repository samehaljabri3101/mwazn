#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
npx prisma migrate deploy

echo "==> Seeding database..."
node prisma/seed.js 2>/dev/null && echo "Seed complete." || echo "Seed skipped (already applied or non-fatal error)."

echo "==> Starting Mwazn backend..."
exec node dist/main
