# Mwazn Release Checklist

Use this checklist before creating any release tag or deploying to a shared/production environment.

---

## Pre-Release Checks

### Code Quality
- [ ] All CI checks pass on `main` (backend build, frontend build, lint, typecheck)
- [ ] No TypeScript errors: `cd apps/backend && npx tsc --noEmit`
- [ ] Frontend build clean: `cd apps/frontend && npm run build`
- [ ] No outstanding critical bugs or known regressions

### Database
- [ ] All Prisma migrations have been reviewed
- [ ] Migration files are committed alongside schema changes
- [ ] Migrations are idempotent where possible (`IF NOT EXISTS` guards)
- [ ] Tested migration path locally: `npx prisma migrate deploy`
- [ ] Seed data is compatible with new schema (if reseed is needed)

### Configuration
- [ ] All required environment variables are documented in `.env.example`
- [ ] No secrets committed to git (check: `git log --all -- "*.env"`)
- [ ] docker-compose.yml `⚠️ demo-only` values are replaced with strong secrets in the target environment
- [ ] JWT secrets use: `openssl rand -hex 32`
- [ ] `NEXT_PUBLIC_API_URL` points to the correct backend host for the target environment

### Functionality (manual smoke test)
Walk through these flows on the deployed instance:

- [ ] Homepage loads (EN + AR)
- [ ] Homepage signed-in redirect works for SUPPLIER_ADMIN, BUYER_ADMIN, FREELANCER, CUSTOMER
- [ ] Login works for all demo accounts
- [ ] Registration — all 3 account types: Business, Freelancer, Customer
- [ ] Dashboard loads with correct role-specific content
- [ ] Supplier listings page: products display with correct images
- [ ] Products public page: category images render correctly
- [ ] Post a new RFQ (BUYER_ADMIN / CUSTOMER)
- [ ] Submit a quote (SUPPLIER_ADMIN / FREELANCER)
- [ ] Analytics page: loads for SUPPLIER_ADMIN, BUYER_ADMIN, FREELANCER, CUSTOMER
- [ ] Admin dashboard: KPIs, companies list, RFQ list, deals, ratings
- [ ] Arabic locale: `/ar/` routes load without 404 or text-direction issues

---

## Release Steps

1. **Run CI manually if needed**
   ```bash
   # Verify main is green before tagging
   gh run list --branch main --limit 5
   ```

2. **Create the release via GitHub Actions**
   - Go to Actions → Release → Run workflow
   - Enter version: `vX.Y.Z` (semantic versioning)
   - Enter release notes (optional)
   - Click "Run workflow"

   OR manually:
   ```bash
   git checkout main
   git pull origin main
   git tag -a vX.Y.Z -m "Mwazn release vX.Y.Z — <brief description>"
   git push origin vX.Y.Z
   ```

3. **Deploy**
   ```bash
   # Pull latest and rebuild
   git pull origin main
   docker compose down
   docker compose up --build -d --wait
   ```

4. **Post-deploy verification**
   ```bash
   # Health checks
   curl -sf http://localhost:3001/health | jq .
   curl -sf http://localhost:3001/ready  | jq .
   curl -sf http://localhost:3000        -o /dev/null -w "%{http_code}\n"
   ```

5. **Confirm seed data is intact**
   ```bash
   docker compose exec backend npx prisma studio
   # Verify Company count > 0 (seed idempotency guard should preserve existing data)
   ```

---

## Rollback

If the new release causes issues:

```bash
# Roll back to the previous tag
git checkout <previous-tag>
docker compose down
docker compose up --build -d --wait
```

For database rollbacks: Prisma does **not** automatically generate down migrations.
If a migration must be reverted, it requires a manual SQL script.
Document any non-trivial migration rollback steps before deploying.

---

## Demo Account Credentials

| Role           | Email                    | Password         |
|----------------|--------------------------|------------------|
| PLATFORM_ADMIN | admin@mwazn.sa           | Admin@1234       |
| SUPPLIER_ADMIN | admin@supplier1.sa       | Supplier@1234    |
| BUYER_ADMIN    | admin@buyer1.sa          | Buyer@1234       |
| FREELANCER     | freelancer@demo.sa       | Freelancer@1234  |
| CUSTOMER       | customer@demo.sa         | Customer@1234    |

> ⚠️ These are **demo-only** credentials. Replace with strong values before any production deployment.

---

## Known Pre-Production Requirements

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the full list of changes required before deploying to a production environment.
