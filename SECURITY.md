# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues by emailing **security@mwazn.sa** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

You will receive a response within **72 hours**. We will work with you to:
- Confirm and reproduce the issue
- Develop and test a fix
- Release a patch
- Credit you in the changelog (unless you prefer to remain anonymous)

## Security Design

### Authentication
- JWT access tokens (15 min TTL) + refresh tokens (7 days)
- bcrypt password hashing (12 rounds in production)
- Rate limiting: 100 requests/minute per IP via `@nestjs/throttler`

### Data
- All user inputs validated via class-validator whitelist mode
- Prisma parameterized queries — no raw SQL injection surface
- File uploads restricted by MIME type and size

### Transport
- CORS restricted to `FRONTEND_URL` environment variable
- HTTPS required in production (terminate at reverse proxy / load balancer)

### Secrets
- All secrets loaded via environment variables — never hardcoded
- `.env` files excluded from version control via `.gitignore`
- Production secrets managed via your platform's secret store (AWS SSM, Doppler, etc.)

### Third-Party Integrations
- Moyasar webhook verified via HMAC-SHA256
- All external API keys feature-flag gated — stub mode when key is absent
