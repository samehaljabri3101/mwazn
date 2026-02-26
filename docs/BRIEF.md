# MWAZN — Full Product Specification

> Production-ready, investor-demo-ready B2B marketplace platform.
> This is NOT a prototype. Every screen must be populated and polished enough to deploy and present to investors tomorrow.

---

## Product Overview

**Mwazn** is a Saudi-focused B2B marketplace where companies can:

- Create RFQs (Request for Quotations)
- Receive supplier quotations
- Browse supplier showrooms and listings
- Compare offers
- Message suppliers internally
- Rate suppliers after deal completion
- Track "transactions" (deal lifecycle) for demo purposes

**Accounts are company-only** (no individuals).
**Bilingual:** Arabic + English — full RTL support for Arabic.

---

## Look & Feel

- Premium SaaS + marketplace quality UI
- Clean spacing, elegant typography, smooth animations
- Neutral palette + Saudi blue accents
- Full RTL support
- High quality icons
- 2xl rounded cards
- Polished dashboards (Buyer / Supplier / Admin)
- Multi-step RFQ form
- Skeleton loaders
- Proper empty states

Do NOT use generic templates.

---

## Tech Stack (Mandatory)

### Backend
| Layer      | Technology              |
|------------|------------------------|
| Framework  | NestJS (TypeScript)     |
| ORM        | Prisma                  |
| Database   | PostgreSQL              |
| Auth       | JWT (Access + Refresh)  |
| API Docs   | Swagger (OpenAPI)       |

### Frontend
| Layer      | Technology              |
|------------|------------------------|
| Framework  | Next.js 14 (App Router) |
| Language   | TypeScript              |
| Styling    | Tailwind CSS            |
| i18n       | Arabic + English + RTL  |

### Infrastructure
| Layer      | Technology                          |
|------------|-------------------------------------|
| Containers | Docker Compose (frontend + backend + db) |
| DB         | Migrations + Seed scripts           |
| Config     | Example .env                        |

### Email
- SMTP abstraction layer
- Dev mode: console logger (no real SMTP needed)

### Testing
- Unit tests
- Minimal e2e tests

---

## Roles

| Role           | Description                              |
|----------------|------------------------------------------|
| Buyer Admin    | Creates RFQs, compares quotes, manages deals |
| Supplier Admin | Manages listings, submits quotes, handles deals |
| Platform Admin | Verifies suppliers, manages platform, views audit logs |

---

## Core Backend Modules

| Module          | Responsibility                            |
|-----------------|-------------------------------------------|
| Auth            | JWT login/logout/refresh, RBAC            |
| Users           | User management within companies          |
| Companies       | Company onboarding, CR verification       |
| Categories      | Product/service categories (AR/EN)        |
| Listings        | Supplier product/service listings         |
| RFQs            | Request for Quotation lifecycle           |
| Quotes          | Supplier quotation submissions            |
| Deals/Transactions | Deal lifecycle management              |
| Ratings/Reviews | Post-deal supplier ratings               |
| Conversations   | Messaging threads between parties        |
| Messages        | Individual messages within threads        |
| Subscriptions   | FREE vs PRO supplier plan management     |
| Admin           | Platform admin operations                |
| AuditLogs       | Action audit trail                       |
| EmailService    | Notification emails (SMTP / dev logger)  |
| FileUpload      | Attachment handling                      |

---

## Key Business Rules

1. **Company-only onboarding** — CR (Commercial Registration) number required
2. **Manual supplier verification** — Platform Admin must approve suppliers
3. **Email notifications only** — no push or SMS
4. **Messaging non-real-time** — polling allowed (no WebSockets required)
5. **FREE suppliers** — limited to 3 quote submissions per month
6. **PRO suppliers** — unlimited quote submissions
7. **Deal lifecycle states:** `Awarded → In Progress → Delivered → Completed → Cancelled`
8. **Ratings required** — suppliers must be rated after deal completion (for demo)

---

## Seed Data (Investor Demo Ready)

| Entity              | Target Count                        |
|---------------------|-------------------------------------|
| Categories          | 25+ (Arabic + English)              |
| Supplier companies  | 25                                  |
| Buyer companies     | 15                                  |
| Listings            | 3–6 per supplier                    |
| RFQs                | 30                                  |
| Quotes              | 80+                                 |
| Deals               | 25+                                 |
| Message threads     | 40+                                 |
| Ratings             | 30+                                 |
| Plan mix            | Mix of FREE and PRO suppliers       |
| Locale              | Saudi company names and cities      |
| Images              | Local bundled images only (offline demo) |

---

## Deliverables

- [ ] Full backend source (NestJS)
- [ ] Full frontend source (Next.js 14)
- [ ] Prisma schema + migrations
- [ ] Seed scripts
- [ ] Docker Compose
- [ ] README with setup instructions and demo credentials
- [ ] Example `.env` files
- [ ] Unit + e2e tests
- [ ] Architecture explanation

---

## Build Milestones

| # | Milestone                                      |
|---|------------------------------------------------|
| 1 | Auth + Companies + RBAC + Categories           |
| 2 | Listings + Supplier Showroom                   |
| 3 | RFQs + Quotes + Email                          |
| 4 | Deals + Ratings                                |
| 5 | Messaging                                      |
| 6 | Admin Panel                                    |
| 7 | Seed + Polish + Tests + Docs                   |

---

*Last updated: 2026-02-26*
