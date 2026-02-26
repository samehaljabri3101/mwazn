import { Injectable } from '@nestjs/common';
import { CompanyType, DealStatus, RFQStatus, SubscriptionPlan, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

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
    ]);

    const proSuppliers = await this.prisma.company.count({
      where: { type: CompanyType.SUPPLIER, plan: SubscriptionPlan.PRO },
    });

    const recentAuditLogs = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    });

    return {
      companies: { total: totalCompanies, buyers: totalBuyers, suppliers: totalCompanies - totalBuyers, verified: verifiedSuppliers, pending: pendingSuppliers, pro: proSuppliers },
      rfqs: { total: totalRFQs, open: openRFQs },
      quotes: { total: totalQuotes },
      deals: { total: totalDeals, active: activeDeals, completed: completedDeals },
      listings: { active: totalListings },
      ratings: { total: totalRatings },
      recentActivity: recentAuditLogs,
    };
  }

  async getPendingVerifications(query: PaginationDto) {
    const where = { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.PENDING };
    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'asc' },
        include: { users: { select: { fullName: true, email: true }, take: 1 } },
      }),
      this.prisma.company.count({ where }),
    ]);
    return paginate(items, total, query.page ?? 1, query.limit ?? 20);
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
