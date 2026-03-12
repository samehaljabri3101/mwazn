import { Injectable } from '@nestjs/common';
import { CompanyType, DealStatus, RFQStatus, SubscriptionPlan, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

const PRO_MONTHLY_PRICE_SAR = 299;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getDashboardStats() {
    const [
      totalCompanies,
      verifiedSuppliers,
      pendingSuppliers,
      totalBuyers,
      totalRFQs,
      openRFQs,
      totalQuotes,
      totalDeals,
      activeDeals,
      completedDeals,
      totalListings,
      totalRatings,
      proSuppliers,
      dealValueCompleted,
      dealValuePipeline,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.VERIFIED } }),
      this.prisma.company.count({ where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.PENDING } }),
      this.prisma.company.count({ where: { type: CompanyType.BUYER } }),
      this.prisma.rFQ.count(),
      this.prisma.rFQ.count({ where: { status: RFQStatus.OPEN } }),
      this.prisma.quote.count(),
      this.prisma.deal.count(),
      this.prisma.deal.count({ where: { status: { in: [DealStatus.AWARDED, DealStatus.IN_PROGRESS, DealStatus.DELIVERED] } } }),
      this.prisma.deal.count({ where: { status: DealStatus.COMPLETED } }),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.rating.count(),
      this.prisma.company.count({ where: { type: CompanyType.SUPPLIER, plan: SubscriptionPlan.PRO } }),
      this.prisma.deal.aggregate({ _sum: { totalAmount: true }, where: { status: DealStatus.COMPLETED } }),
      this.prisma.deal.aggregate({ _sum: { totalAmount: true }, where: { status: { in: [DealStatus.AWARDED, DealStatus.IN_PROGRESS, DealStatus.DELIVERED] } } }),
    ]);

    const recentAuditLogs = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    });

    const toNum = (d: any) => d ? parseFloat(String(d)) : 0;

    return {
      companies: { total: totalCompanies, buyers: totalBuyers, suppliers: totalCompanies - totalBuyers, verified: verifiedSuppliers, pending: pendingSuppliers, pro: proSuppliers },
      rfqs: { total: totalRFQs, open: openRFQs },
      quotes: { total: totalQuotes },
      deals: { total: totalDeals, active: activeDeals, completed: completedDeals },
      listings: { active: totalListings },
      ratings: { total: totalRatings },
      financial: {
        gmv: toNum(dealValueCompleted._sum.totalAmount),
        pipeline: toNum(dealValuePipeline._sum.totalAmount),
        estimatedMonthlyRevenue: proSuppliers * PRO_MONTHLY_PRICE_SAR,
        avgQuotesPerRFQ: totalRFQs > 0 ? Math.round((totalQuotes / totalRFQs) * 10) / 10 : 0,
      },
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
}
