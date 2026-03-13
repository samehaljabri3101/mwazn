# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy @mwazn/contracts source so tsconfig path alias resolves during build.
# tsconfig.json paths: "@mwazn/contracts" → "../../packages/contracts/src"
# resolves from /app/apps/frontend to /app/packages/contracts/src  ✓
COPY packages/contracts/ ./packages/contracts/

# Install frontend dependencies (leverage layer cache)
COPY apps/frontend/package.json apps/frontend/package-lock.json ./apps/frontend/
WORKDIR /app/apps/frontend
RUN npm ci

# Copy remaining frontend source
COPY apps/frontend/ .

# Accept API URL as build arg so client-side bundle uses the right base URL
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ── Stage 2: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production runtime deps (next, react, etc.) — devDeps excluded
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY apps/frontend/next.config.mjs ./next.config.mjs
COPY apps/frontend/messages ./messages

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
