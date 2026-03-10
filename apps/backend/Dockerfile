# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build
# Compile seed.ts → prisma/seed.js so the runner always has the latest seed
RUN npx tsc --module commonjs --target es2020 --esModuleInterop true \
    --resolveJsonModule true --strict false --skipLibCheck true \
    --rootDir . --outDir /tmp/seed-out prisma/seed.ts && \
    cp /tmp/seed-out/prisma/seed.js prisma/seed.js

# ── Stage 2: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl dumb-init
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
# Overwrite with the freshly-compiled seed.js from builder
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh && \
    mkdir -p /app/uploads && \
    chown -R node:node /app

USER node

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["/bin/sh", "/app/docker-entrypoint.sh"]
