# Contributing to Mwazn

Thank you for your interest in contributing!

## Development Setup

1. **Prerequisites**: Node.js 20+, Docker, Docker Compose
2. **Clone** the repository and copy env files:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   ```
3. **Start services**: `docker compose up -d db`
4. **Install & run backend**:
   ```bash
   cd apps/backend && npm ci
   npx prisma migrate dev
   npm run seed        # optional demo data
   npm run start:dev
   ```
5. **Install & run frontend**:
   ```bash
   cd apps/frontend && npm ci && npm run dev
   ```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code only |
| `develop` | Active development |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

## Pull Request Guidelines

- Target `develop` (never commit directly to `main`)
- All CI checks must pass before merge
- Keep PRs focused — one concern per PR
- Add bilingual (AR/EN) copy for any user-facing text
- Do not commit `.env` files or secrets

## Code Standards

- **TypeScript strict mode** — no implicit `any`
- **NestJS conventions** — module/service/controller per domain
- **Prisma migrations** — always use `prisma migrate dev`, never `prisma db push --force`
- **Idempotent seeds** — seeding must be safe to run multiple times

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add supplier CSV export
fix: correct RFQ status transition
chore: update prisma to 5.11
docs: add deployment guide
```

## Reporting Bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, Docker version)

## Security Issues

See [SECURITY.md](SECURITY.md) for responsible disclosure.
