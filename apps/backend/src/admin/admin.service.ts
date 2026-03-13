import { Injectable, NotFoundException } from '@nestjs/common';
import { AppealStatus, CompanyType, DealStatus, ModerationSource, ModerationStatus, RFQStatus, SubscriptionPlan, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AppealsService } from '../appeals/appeals.service';
import { AdminRespondAppealDto } from '../appeals/dto/admin-respond-appeal.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

const PRO_MONTHLY_PRICE_SAR = 299;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly appealsService: AppealsService,
  ) {}

  async getDashboardStats() {
    const [
      totalCompanies,
      verifiedSuppliers,
      pendingSuppliers,
      rejectedSuppliers,
      totalBuyers,
      totalRFQs,
      openRFQs,
      totalQuotes,
      totalDeals,
      activeDeals,
      completedDeals,
      cancelledDeals,
      totalListings,
      totalRatings,
      proSuppliers,
      dealValueCompleted,
      dealValuePipeline,
      zeroQuoteRfqs,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.VERIFIED } }),
      this.prisma.company.count({ where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.PENDING } }),
      this.prisma.company.count({ where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.REJECTED } }),
      this.prisma.company.count({ where: { type: CompanyType.BUYER } }),
      this.prisma.rFQ.count(),
      this.prisma.rFQ.count({ where: { status: RFQStatus.OPEN } }),
      this.prisma.quote.count(),
      this.prisma.deal.count(),
      this.prisma.deal.count({ where: { status: { in: [DealStatus.AWARDED, DealStatus.IN_PROGRESS, DealStatus.DELIVERED] } } }),
      this.prisma.deal.count({ where: { status: DealStatus.COMPLETED } }),
      this.prisma.deal.count({ where: { status: DealStatus.CANCELLED } }),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.rating.count(),
      this.prisma.company.count({ where: { type: CompanyType.SUPPLIER, plan: SubscriptionPlan.PRO } }),
      this.prisma.deal.aggregate({ _sum: { totalAmount: true }, where: { status: DealStatus.COMPLETED } }),
      this.prisma.deal.aggregate({ _sum: { totalAmount: true }, where: { status: { in: [DealStatus.AWARDED, DealStatus.IN_PROGRESS, DealStatus.DELIVERED] } } }),
      this.prisma.rFQ.count({
        where: {
          status: RFQStatus.OPEN,
          moderationStatus: ModerationStatus.ACTIVE,
          createdAt: { lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          quotes: { none: {} },
        },
      }),
    ]);

    const recentAuditLogs = await this.prisma.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    });

    const toNum = (d: any) => d ? parseFloat(String(d)) : 0;

    return {
      companies: { total: totalCompanies, buyers: totalBuyers, suppliers: totalCompanies - totalBuyers, verified: verifiedSuppliers, pending: pendingSuppliers, rejected: rejectedSuppliers, pro: proSuppliers },
      rfqs: { total: totalRFQs, open: openRFQs },
      quotes: { total: totalQuotes },
      deals: { total: totalDeals, active: activeDeals, completed: completedDeals, cancelled: cancelledDeals },
      listings: { active: totalListings },
      ratings: { total: totalRatings },
      financial: {
        gmv: toNum(dealValueCompleted._sum.totalAmount),
        pipeline: toNum(dealValuePipeline._sum.totalAmount),
        estimatedMonthlyRevenue: proSuppliers * PRO_MONTHLY_PRICE_SAR,
        avgQuotesPerRFQ: totalRFQs > 0 ? Math.round((totalQuotes / totalRFQs) * 10) / 10 : 0,
      },
      procurement: { zeroQuoteRfqs },
      recentActivity: recentAuditLogs,
    };
  }

  async getPendingVerifications(query: PaginationDto) {
    const where = { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.PENDING };
    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'asc' },
        include: { users: { select: { fullName: true, email: true }, take: 1 } },
      }),
      this.prisma.company.count({ where }),
    ]);
    return paginate(items, total, _page, _limit);
  }

  async getAuditLogs(query: PaginationDto & { entity?: string }) {
    return this.audit.findAll(query);
  }

  async setPlan(companyId: string, plan: SubscriptionPlan, adminUserId: string) {
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { plan },
    });
    await this.audit.log({
      action: 'SET_PLAN',
      entity: 'Company',
      entityId: companyId,
      userId: adminUserId,
      after: { plan },
    });
    return company;
  }

  // ─── Content Moderation ────────────────────────────────────────────────────

  async moderateRFQ(id: string, action: 'remove' | 'restore' | 'flag', reason: string | undefined, adminUserId: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const statusMap = { remove: ModerationStatus.REMOVED, restore: ModerationStatus.ACTIVE, flag: ModerationStatus.FLAGGED };
    const actionMap = { remove: 'RFQ_REMOVED_BY_ADMIN', restore: 'RFQ_RESTORED_BY_ADMIN', flag: 'RFQ_FLAGGED_BY_ADMIN' };

    const updated = await this.prisma.rFQ.update({
      where: { id },
      data: {
        moderationStatus: statusMap[action],
        moderationReason: action === 'restore' ? null : (reason ?? rfq.moderationReason),
        moderatedById: adminUserId,
        moderatedAt: new Date(),
        moderationSource: action === 'restore' ? null : ModerationSource.ADMIN,
      },
    });

    await this.audit.log({
      action: actionMap[action],
      entity: 'RFQ',
      entityId: id,
      userId: adminUserId,
      after: { moderationStatus: statusMap[action], reason },
    });

    // Notify RFQ owner by email on flag/remove
    if (action === 'flag' || action === 'remove') {
      const ownerUsers = await this.prisma.user.findMany({
        where: { companyId: rfq.buyerId },
        select: { email: true },
      });
      for (const u of ownerUsers) {
        this.email.sendModerationAction(u.email, rfq.title, action === 'flag' ? 'flagged' : 'removed', reason).catch(() => {});
      }
    }

    return updated;
  }

  async moderateListing(id: string, action: 'remove' | 'restore' | 'flag', reason: string | undefined, adminUserId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const statusMap = { remove: ModerationStatus.REMOVED, restore: ModerationStatus.ACTIVE, flag: ModerationStatus.FLAGGED };
    const actionMap = { remove: 'LISTING_REMOVED_BY_ADMIN', restore: 'LISTING_RESTORED_BY_ADMIN', flag: 'LISTING_FLAGGED_BY_ADMIN' };

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        moderationStatus: statusMap[action],
        moderationReason: action === 'restore' ? null : (reason ?? listing.moderationReason),
        moderatedById: adminUserId,
        moderatedAt: new Date(),
        moderationSource: action === 'restore' ? null : ModerationSource.ADMIN,
      },
    });

    await this.audit.log({
      action: actionMap[action],
      entity: 'Listing',
      entityId: id,
      userId: adminUserId,
      after: { moderationStatus: statusMap[action], reason },
    });

    // Notify listing owner by email on flag/remove
    if (action === 'flag' || action === 'remove') {
      const ownerUsers = await this.prisma.user.findMany({
        where: { companyId: listing.supplierId },
        select: { email: true },
      });
      for (const u of ownerUsers) {
        this.email.sendModerationAction(u.email, listing.titleEn, action === 'flag' ? 'flagged' : 'removed', reason).catch(() => {});
      }
    }

    return updated;
  }

  async getFlaggedContent(query: PaginationDto) {
    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const flaggedStatuses = [ModerationStatus.FLAGGED, ModerationStatus.REMOVED];

    const [rfqs, rfqTotal, listings, listingTotal] = await Promise.all([
      this.prisma.rFQ.findMany({
        where: { moderationStatus: { in: flaggedStatuses } },
        skip: 0,
        take: Math.ceil(_limit / 2),
        orderBy: { moderatedAt: 'desc' },
        include: { buyer: { select: { id: true, nameAr: true, nameEn: true } } },
      }),
      this.prisma.rFQ.count({ where: { moderationStatus: { in: flaggedStatuses } } }),
      this.prisma.listing.findMany({
        where: { moderationStatus: { in: flaggedStatuses } },
        skip: 0,
        take: Math.ceil(_limit / 2),
        orderBy: { moderatedAt: 'desc' },
        include: { supplier: { select: { id: true, nameAr: true, nameEn: true } } },
      }),
      this.prisma.listing.count({ where: { moderationStatus: { in: flaggedStatuses } } }),
    ]);

    const rfqItems = rfqs.map((r) => ({ ...r, contentType: 'RFQ' as const }));
    const listingItems = listings.map((l) => ({ ...l, contentType: 'LISTING' as const }));
    const combined = [...rfqItems, ...listingItems].sort((a, b) => {
      const aDate = a.moderatedAt ? a.moderatedAt.getTime() : a.createdAt.getTime();
      const bDate = b.moderatedAt ? b.moderatedAt.getTime() : b.createdAt.getTime();
      return bDate - aDate;
    });

    return paginate(combined, rfqTotal + listingTotal, _page, _limit);
  }

  // ─── Appeal delegation ─────────────────────────────────────────────────────

  getAppeals(query: PaginationDto & { status?: AppealStatus }) {
    return this.appealsService.adminFindAll(query);
  }

  getAppeal(id: string, adminUserId: string) {
    return this.appealsService.findOne(id, adminUserId);
  }

  respondAppeal(id: string, dto: AdminRespondAppealDto, adminUserId: string) {
    return this.appealsService.adminRespond(id, dto, adminUserId);
  }

  acceptAppeal(id: string, dto: AdminRespondAppealDto, adminUserId: string) {
    return this.appealsService.adminAccept(id, dto, adminUserId);
  }

  rejectAppeal(id: string, dto: AdminRespondAppealDto, adminUserId: string) {
    return this.appealsService.adminReject(id, dto, adminUserId);
  }

  // ─── Admin Listings ────────────────────────────────────────────────────────

  async getAdminListings(query: PaginationDto & { search?: string; moderationStatus?: string }) {
    const _page = Number(query.page) || 1;
    const _limit = Math.min(Number(query.limit) || 30, 100);

    const where: Record<string, unknown> = {};
    if (query.moderationStatus) where.moderationStatus = query.moderationStatus;
    if (query.search) {
      where.OR = [
        { titleEn: { contains: query.search, mode: 'insensitive' } },
        { titleAr: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, nameAr: true, nameEn: true } },
          category: { select: { nameAr: true, nameEn: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(items, total, _page, _limit);
  }
}
