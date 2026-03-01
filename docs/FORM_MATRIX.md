# Mwazn — Enterprise Form Matrix

> Audit date: 2026-03-01
> Status: All gaps implemented in migration `20260301120000_enterprise_form_fields`

---

## 1. Company Registration (Buyer + Supplier)

| Field | Existing | Added | Validation | DB Impact |
|-------|----------|-------|-----------|-----------|
| Company Name AR | ✓ | — | required, string | — |
| Company Name EN | ✓ | — | required, string | — |
| CR Number | ✓ | — | /^\d{10}$/ | — |
| CR Expiry Date | ✗ | ✓ | IsDateString | Company.crExpiryDate |
| VAT Number | ✗ | ✓ | /^\d{15}$/ (ZATCA) | Company.vatNumber |
| Legal Form | ✗ | ✓ | IsEnum: LLC/EST/CORP/PARTNER/JOINT | Company.legalForm |
| Establishment Year | ✗ | ✓ | IsInt, min 1900, max current | Company.establishmentYear |
| City | ✓ | — | dropdown | — |
| Phone | ✓ | — | optional string | — |
| Primary Contact Job Title | ✗ | ✓ | optional string | Company.contactJobTitle |
| Company Size Range | ✗ | ✓ | IsEnum: 1-10/11-50/51-200/201-500/500+ | Company.companySizeRange |
| Sectors (multi-select) | ✗ | ✓ | IsArray, IsString each | Company.sectors |
| Full Name | ✓ | — | required string | — |
| Email | ✓ | — | IsEmail | — |
| Password | ✓ | — | MinLength(8) | — |

---

## 2. Supplier Profile (Company Profile Edit)

| Field | Existing | Added | Validation | DB Impact |
|-------|----------|-------|-----------|-----------|
| Logo URL | ✓ | — | optional | — |
| Cover Image URL | ✗ | ✓ | optional URL | Company.coverImageUrl |
| Description AR | ✓ | — | optional text | — |
| Description EN | ✓ | — | optional text | — |
| Website | ✓ | — | optional | — |
| Key Clients | ✗ | ✓ | IsArray, string[] | Company.keyClients |
| Regions Served | ✗ | ✓ | IsArray, string[] | Company.regionsServed |
| Payment Terms Accepted | ✗ | ✓ | IsArray, string[] | Company.paymentTermsAccepted |
| Production Capacity | ✗ | ✓ | optional string | Company.productionCapacity |
| ISO Certificate URL | ✗ | ✓ | optional | Company.isoUrl |
| Chamber Cert URL | ✗ | ✓ | optional | Company.chamberCertUrl |
| Tax Certificate URL | ✗ | ✓ | optional | Company.taxCertUrl |

---

## 3. RFQ Creation (MOST IMPORTANT)

| Field | Existing | Added | Validation | DB Impact |
|-------|----------|-------|-----------|-----------|
| Title | ✓ | — | required | — |
| Description | ✓ | — | required text | — |
| Category | ✓ | — | required | — |
| Project Type | ✗ | ✓ | IsEnum: PRODUCT/SERVICE/MANUFACTURING/CONSULTANCY | RFQ.projectType |
| Quantity | ✓ | — | optional int min 1 | — |
| Unit | ✓ | — | optional | — |
| Budget (single) | ✓ | kept | optional decimal | — |
| Budget Min | ✗ | ✓ | optional decimal | RFQ.budgetMin |
| Budget Max | ✗ | ✓ | optional decimal | RFQ.budgetMax |
| Budget Undisclosed | ✗ | ✓ | IsBoolean | RFQ.budgetUndisclosed |
| VAT Included Flag | ✗ | ✓ | IsBoolean | RFQ.vatIncluded |
| Deadline | ✓ | — | IsDateString | — |
| Expected Start Date | ✗ | ✓ | IsDateString | RFQ.expectedStartDate |
| Location Requirement | ✗ | ✓ | optional string | RFQ.locationRequirement |
| Site Visit Required | ✗ | ✓ | IsBoolean | RFQ.siteVisitRequired |
| NDA Required | ✗ | ✓ | IsBoolean | RFQ.ndaRequired |
| Required Certifications | ✗ | ✓ | IsArray, string[] | RFQ.requiredCertifications |
| Visibility | ✗ | ✓ | IsEnum: PUBLIC/INVITE_ONLY | RFQ.visibility |
| Allow Partial Bids | ✗ | ✓ | IsBoolean | RFQ.allowPartialBids |

---

## 4. Quote Submission

| Field | Existing | Added | Validation | DB Impact |
|-------|----------|-------|-----------|-----------|
| Total Price | ✓ | — | required number | — |
| Currency | ✓ | — | optional | — |
| Delivery Days | ✓ | — | optional int min 1 | — |
| Notes | ✓ | — | optional text | — |
| Valid Until | ✓ | — | IsDateString | — |
| VAT % | ✗ | ✓ | IsNumber, min 0, max 100 | Quote.vatPercent |
| Payment Terms | ✗ | ✓ | optional string | Quote.paymentTerms |
| Warranty (months) | ✗ | ✓ | optional int min 0 | Quote.warrantyMonths |
| After-Sales Support | ✗ | ✓ | optional text | Quote.afterSalesSupport |
| Technical Proposal | ✗ | ✓ | optional text | Quote.technicalProposal |
| Line Items | ✗ | ✓ | optional JSON array | Quote.lineItems |

---

## 5. Product Listing

| Field | Existing | Added | Validation | DB Impact |
|-------|----------|-------|-----------|-----------|
| Title AR | ✓ | — | required | — |
| Title EN | ✓ | — | required | — |
| Description AR | ✓ | — | optional | — |
| Description EN | ✓ | — | optional | — |
| Category | ✓ | — | required | — |
| Price Range | ✓ | — | optional decimal | — |
| Unit | ✓ | — | optional | — |
| Min Order Qty | ✓ | — | optional int | — |
| Lead Time Days | ✓ | — | optional int | — |
| Tags | ✓ | — | string[] | — |
| Certifications | ✓ | — | string[] | — |
| SKU | ✗ | ✓ | optional string | Listing.sku |
| Specs (key-value table) | ✗ | ✓ | optional JSON | Listing.specsJson |
| Request Quote Only | ✗ | ✓ | IsBoolean | Listing.requestQuoteOnly |
| VAT % | ✗ | ✓ | IsNumber min 0 max 100 | Listing.vatPercent |
| Stock Availability | ✗ | ✓ | IsEnum: IN_STOCK/OUT_OF_STOCK/LIMITED | Listing.stockAvailability |

---

## 6. Showroom / Supplier Profile Display

Handled via Company profile edit (same UpdateCompanyDto).
Added fields: coverImageUrl, keyClients, regionsServed, paymentTermsAccepted, productionCapacity, compliance document URLs.

---

## 7. Messaging

| Field | Existing | Added | Validation | DB Impact |
|-------|----------|-------|-----------|-----------|
| Message Body | ✓ | — | required | — |
| Message Type | ✗ | ✓ | IsEnum: GENERAL/CLARIFICATION/NEGOTIATION/TECHNICAL/COMMERCIAL | Message.messageType |
| Priority | ✗ | ✓ | IsEnum: NORMAL/URGENT | Message.priority |
| RFQ Reference | ✗ | ✓ | optional cuid | Conversation.rfqId |

---

## 8. Admin — Company Management

| Field | Existing | Added | Validation | DB Impact |
|-------|----------|-------|-----------|-----------|
| Verify / Reject | ✓ | — | enum | — |
| Set Plan (FREE/PRO) | ✓ | — | — | — |
| Admin Notes | ✗ | ✓ | optional text | Company.adminNotes |
| Plan Expires At | ✗ | ✓ | display only | Company.planExpiresAt |
| VAT Number display | ✗ | ✓ | display | — |
| CR Expiry display | ✗ | ✓ | display | — |

---

## Migration File

`apps/backend/prisma/migrations/20260301120000_enterprise_form_fields/migration.sql`

## Files Changed

### Backend
- `prisma/schema.prisma`
- `prisma/migrations/20260301120000_enterprise_form_fields/migration.sql`
- `prisma/seed.ts`
- `src/auth/dto/register-buyer.dto.ts`
- `src/auth/dto/register-supplier.dto.ts`
- `src/auth/dto/register.dto.ts`
- `src/companies/dto/update-company.dto.ts`
- `src/rfqs/dto/rfq.dto.ts`
- `src/quotes/dto/quote.dto.ts`
- `src/listings/dto/listing.dto.ts`
- `src/companies/dto/verify-company.dto.ts` (adminNotes)

### Frontend
- `src/app/[locale]/auth/register/page.tsx`
- `src/app/[locale]/dashboard/profile/page.tsx`
- `src/app/[locale]/dashboard/buyer/rfqs/new/page.tsx`
- `src/app/[locale]/dashboard/supplier/rfqs/[id]/page.tsx`
- `src/app/[locale]/dashboard/supplier/listings/new/page.tsx`
- `src/app/[locale]/dashboard/messages/[id]/page.tsx`
- `src/app/[locale]/dashboard/admin/companies/page.tsx`
- `src/types/index.ts`
