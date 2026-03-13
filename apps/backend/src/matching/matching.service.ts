import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  // Match score: categoryMatch 40% + trustScore 25% + listingRelevance 10% + location 10% + responseRate 15%
  private computeMatchScore(supplier: any, rfq: any): number {
    // categoryMatch (40pts): does supplier have ACTIVE listings in this category?
    const catMatch = supplier.listings.some(
      (l: any) => l.categoryId === rfq.categoryId && l.status === 'ACTIVE',
    ) ? 40 : 0;
    // trustScore (25pts): supplierScore 0-100 → 0-25
    const trustPts = Math.round((supplier.supplierScore ?? 0) / 4);
    // listingRelevance (10pts): has any listing in category
    const listPts = catMatch > 0 ? 10 : 0;
    // location (10pts): city match with rfq.locationRequirement
    const locPts =
      rfq.locationRequirement &&
      supplier.city &&
      rfq.locationRequirement.toLowerCase().includes(supplier.city.toLowerCase())
        ? 10
        : 5;
    // responseRate (15pts): proxy based on quotes submitted count
    const accepted = supplier._count?.quotesSubmitted ?? 0;
    const respPts = Math.min(accepted * 3, 15);
    return catMatch + trustPts + listPts + locPts + respPts;
  }

  async matchSuppliersForRFQ(rfqId: string, limit = 10): Promise<any[]> {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) return [];

    const suppliers = await this.prisma.company.findMany({
      where: {
        type: 'SUPPLIER',
        isActive: true,
        verificationStatus: 'VERIFIED',
        listings: {
          some: { categoryId: rfq.categoryId, status: 'ACTIVE', moderationStatus: 'ACTIVE' },
        },
      },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          select: { id: true, categoryId: true, status: true },
        },
        _count: { select: { quotesSubmitted: true } },
      },
      take: 50,
    });

    return suppliers
      .map((s) => ({ ...s, matchScore: this.computeMatchScore(s, rfq) }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ listings: _listings, _count: _cnt, ...s }) => s);
  }

  async matchRFQsForSupplier(supplierId: string, limit = 20): Promise<any[]> {
    const supplier = await this.prisma.company.findUnique({
      where: { id: supplierId },
      include: {
        listings: { where: { status: 'ACTIVE' }, select: { categoryId: true } },
      },
    });
    if (!supplier) return [];

    const catIds = [...new Set(supplier.listings.map((l) => l.categoryId))];
    if (catIds.length === 0) return [];

    const quotedRfqIds = await this.prisma.quote
      .findMany({ where: { supplierId }, select: { rfqId: true } })
      .then((q) => q.map((r) => r.rfqId));

    return this.prisma.rFQ.findMany({
      where: {
        status: 'OPEN',
        moderationStatus: 'ACTIVE',
        categoryId: { in: catIds },
        id: { notIn: quotedRfqIds.length > 0 ? quotedRfqIds : ['__none__'] },
      },
      include: {
        category: { select: { nameEn: true, nameAr: true } },
        buyer: { select: { nameEn: true, nameAr: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRFQInsights(rfqId: string): Promise<any> {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) return null;

    const [supplierCount, quotesData] = await Promise.all([
      this.prisma.company.count({
        where: {
          type: 'SUPPLIER',
          isActive: true,
          verificationStatus: 'VERIFIED',
          listings: {
            some: { categoryId: rfq.categoryId, status: 'ACTIVE', moderationStatus: 'ACTIVE' },
          },
        },
      }),
      this.prisma.quote.findMany({
        where: { rfqId },
        select: { price: true },
      }),
    ]);

    const prices = quotesData.map((q) => Number(q.price)).filter((p) => p > 0);

    return {
      matchingSupplierCount: supplierCount,
      receivedQuotes: prices.length,
      avgQuotePrice:
        prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : null,
      minQuotePrice: prices.length > 0 ? Math.min(...prices) : null,
      maxQuotePrice: prices.length > 0 ? Math.max(...prices) : null,
    };
  }
}
