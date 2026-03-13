/**
 * Compound auth/role decorators for common access patterns.
 *
 * Each decorator combines JwtAuthGuard + RolesGuard + @Roles() into a single
 * annotation, making controller-level authorization intent explicit and reducing
 * boilerplate compared to writing `@UseGuards(JwtAuthGuard, RolesGuard)` +
 * `@Roles(...)` + `@ApiBearerAuth()` on every protected endpoint.
 *
 * These decorators encode the same permission model as the frontend's
 * permissions.ts (canManageProducts, canPostRFQ, canAccessAdmin, etc.).
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 * @SellerOnly()   → SUPPLIER_ADMIN or FREELANCER required
 * @BuyerOnly()    → BUYER_ADMIN or CUSTOMER required
 * @RFQPosterOnly() → BUYER_ADMIN, CUSTOMER, or FREELANCER required
 *                   (FREELANCER is a dual-role and can post RFQs)
 * @AdminOnly()    → PLATFORM_ADMIN required
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { SELLER_ROLES, BUYER_ROLES, RFQ_POSTER_ROLES } from '../constants/platform.constants';

/**
 * Requires authentication and a seller role (SUPPLIER_ADMIN or FREELANCER).
 * Applied to: POST /listings, POST /listings/bulk-import, POST /quotes
 */
export function SellerOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...SELLER_ROLES),
    ApiBearerAuth('access-token'),
  );
}

/**
 * Requires authentication and a buyer role (BUYER_ADMIN or CUSTOMER).
 * Does NOT include FREELANCER — use RFQPosterOnly() for RFQ-creation endpoints
 * where FREELANCER should also have access.
 */
export function BuyerOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...BUYER_ROLES),
    ApiBearerAuth('access-token'),
  );
}

/**
 * Requires authentication and RFQ-posting permission.
 * Allows BUYER_ADMIN, CUSTOMER, and FREELANCER (dual-role).
 * Applied to: POST /rfqs
 */
export function RFQPosterOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...RFQ_POSTER_ROLES),
    ApiBearerAuth('access-token'),
  );
}

/**
 * Requires authentication and PLATFORM_ADMIN role.
 * Applied to: admin dashboard, verification controls, company management.
 */
export function AdminOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(Role.PLATFORM_ADMIN),
    ApiBearerAuth('access-token'),
  );
}
