import { Injectable } from '@nestjs/common';
import { DealStatus, ListingStatus, QuoteStatus, RFQStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
  ) {}

  async getSupplierAnalytics(companyId: string) {
    const [
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      withdrawnQuotes,
      totalDeals,
      completedDeals,
      cancelledDeals,
      activeListings,
      totalListings,
      company,
    ] = await Promise.all([
      this.prisma.quote.count({ where: { supplierId: companyId } }),
      this.prisma.quote.count({ where: { supplierId: companyId, status: QuoteStatus.ACCEPTED } }),
      this.prisma.quote.count({ where: { supplierId: companyId, status: QuoteStatus.REJECTED } }),
      this.prisma.quote.count({ where: { supplierId: companyId, status: QuoteStatus.WITHDRAWN } }),
      this.prisma.deal.count({ where: { supplierId: companyId } }),
      this.prisma.deal.count({ where: { supplierId: companyId, status: DealStatus.COMPLETED } }),
      this.prisma.deal.count({ where: { supplierId: companyId, status: DealStatus.CANCELLED } }),
      this.prisma.listing.count({ where: { supplierId: companyId, status: ListingStatus.ACTIVE } }),
      this.prisma.listing.count({ where: { supplierId: companyId } }),
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { verificationStatus: true, plan: true, supplierScore: true, avgRating: true },
      }),
    ]);

    const pendingQuotes = totalQuotes - acceptedQuotes - rejectedQuotes - withdrawnQuotes;
    const winRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
    const deliverySuccessRate = completedDeals + cancelledDeals > 0
      ? Math.round((completedDeals / (completedDeals + cancelledDeals)) * 100)
      : null;
    const trustTier = company ? this.scoringService.getTrustTier({
      verificationStatus: String(company.verificationStatus),
      plan: String(company.plan),
      supplierScore: company.supplierScore ? Number(company.supplierScore) : null,
    }) : 'STANDARD';

    const completedDealsData = await this.prisma.deal.findMany({
      where: { supplierId: companyId, status: DealStatus.COMPLETED },
      select: { totalAmount: true },
    });

    const totalRevenue = completedDealsData.reduce(
      (sum, d) => sum + Number(d.totalAmount),
      0,
    );

    const ratings = await this.prisma.rating.findMany({
      where: { ratedId: companyId },
      select: { score: true },
    });

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
        : null;

    const topProducts = await this.prisma.listing.findMany({
      where: { supplierId: companyId },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        slug: true,
        viewCount: true,
        status: true,
        _count: { select: { quotes: true } },
      },
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentQuotes = await this.prisma.quote.findMany({
      where: { supplierId: companyId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const monthlyData = buildMonthlyBuckets(recentQuotes);

    return {
      overview: {
        totalQuotes,
        pendingQuotes,
        acceptedQuotes,
        rejectedQuotes,
        winRate,
        totalDeals,
        completedDeals,
        cancelledDeals,
        activeListings,
        totalListings,
        totalRevenue,
        avgRating: avgRating ? Number(avgRating.toFixed(1)) : null,
        totalRatings: ratings.length,
        deliverySuccessRate,
        trustTier,
        supplierScore: company?.supplierScore ? Number(company.supplierScore) : null,
      },
      topProducts,
      monthlyQuotes: monthlyData,
    };
  }

  async getBuyerAnalytics(companyId: string) {
    const [
      totalRfqs,
      openRfqs,
      closedRfqs,
      awardedRfqs,
      cancelledRfqs,
      totalDeals,
      completedDeals,
    ] = await Promise.all([
      this.prisma.rFQ.count({ where: { buyerId: companyId } }),
      this.prisma.rFQ.count({ where: { buyerId: companyId, status: RFQStatus.OPEN } }),
      this.prisma.rFQ.count({ where: { buyerId: companyId, status: RFQStatus.CLOSED } }),
      this.prisma.rFQ.count({ where: { buyerId: companyId, status: RFQStatus.AWARDED } }),
      this.prisma.rFQ.count({ where: { buyerId: companyId, status: RFQStatus.CANCELLED } }),
      this.prisma.deal.count({ where: { buyerId: companyId } }),
      this.prisma.deal.count({ where: { buyerId: companyId, status: DealStatus.COMPLETED } }),
    ]);

    const completedDealsData = await this.prisma.deal.findMany({
      where: { buyerId: companyId, status: DealStatus.COMPLETED },
      select: { totalAmount: true },
    });

    const totalSpending = completedDealsData.reduce(
      (s, d) => s + Number(d.totalAmount),
      0,
    );

    const totalQuotesReceived = await this.prisma.quote.count({
      where: { rfq: { buyerId: companyId } },
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentRfqs = await this.prisma.rFQ.findMany({
      where: { buyerId: companyId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const monthlyData = buildMonthlyBuckets(recentRfqs);

    const awardRate =
      totalRfqs > 0 ? Math.round((awardedRfqs / totalRfqs) * 100) : 0;

    return {
      overview: {
        totalRfqs,
        openRfqs,
        closedRfqs,
        awardedRfqs,
        cancelledRfqs,
        awardRate,
        totalDeals,
        completedDeals,
        totalSpending,
        totalQuotesReceived,
        avgQuotesPerRfq:
          totalRfqs > 0 ? Math.round(totalQuotesReceived / totalRfqs) : 0,
      },
      monthlyRfqs: monthlyData,
    };
  }

  async exportSupplierCsv(companyId: string): Promise<string> {
    const [quotes, deals, listings] = await Promise.all([
      this.prisma.quote.findMany({
        where: { supplierId: companyId },
        include: { rfq: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deal.findMany({
        where: { supplierId: companyId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.findMany({
        where: { supplierId: companyId },
        select: { titleEn: true, status: true, viewCount: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const rows: string[] = [
      'Section,Metric,Value',
      ...quotes.map(
        (q) =>
          `Quotes,"${q.rfq?.title || q.rfqId}","${q.status} — ${q.price} ${q.currency}"`,
      ),
      ...deals.map(
        (d) =>
          `Deals,"Deal ${d.id.slice(-6)}","${d.status} — ${d.totalAmount} ${d.currency}"`,
      ),
      ...listings.map(
        (l) =>
          `Listings,"${l.titleEn}","${l.status} — ${l.viewCount} views"`,
      ),
    ];

    return rows.join('\n');
  }

  async exportBuyerCsv(companyId: string): Promise<string> {
    const [rfqs, deals] = await Promise.all([
      this.prisma.rFQ.findMany({
        where: { buyerId: companyId },
        include: {
          category: { select: { nameEn: true } },
          _count: { select: { quotes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deal.findMany({
        where: { buyerId: companyId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const rows: string[] = [
      'Section,Title,Details',
      ...rfqs.map(
        (r) =>
          `RFQs,"${r.title}","${r.status} — ${r._count.quotes} quotes — ${r.category?.nameEn || ''}"`,
      ),
      ...deals.map(
        (d) =>
          `Deals,"Deal ${d.id.slice(-6)}","${d.status} — ${d.totalAmount} ${d.currency}"`,
      ),
    ];

    return rows.join('\n');
  }
}

function buildMonthlyBuckets(items: Array<{ createdAt: Date }>) {
  const now = new Date();
  const months: { label: string; month: string; count: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('en', { month: 'short' }),
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      count: 0,
    });
  }

  for (const item of items) {
    const key = `${item.createdAt.getFullYear()}-${String(
      item.createdAt.getMonth() + 1,
    ).padStart(2, '0')}`;
    const bucket = months.find((m) => m.month === key);
    if (bucket) bucket.count++;
  }

  return months;
}