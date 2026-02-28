#!/usr/bin/env bash
# reset-dev.sh — wipe local dev database and reseed
# NEVER run against production.

set -euo pipefail

if [ "${NODE_ENV:-}" = "production" ]; then
  echo "ERROR: This script must not run in production." >&2
  exit 1
fi

echo "⚠️  Resetting dev database and reseeding..."
cd "$(dirname "$0")/.."

npx prisma migrate reset --force
ts-node prisma/seed.ts

echo "✅ Dev database reset complete."
