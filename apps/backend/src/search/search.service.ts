import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    const term = q?.trim() ?? '';
    if (term.length < 2) return { companies: [], listings: [], categories: [] };

    const [companies, listings, categories] = await Promise.all([
      this.prisma.company.findMany({
        where: {
          type: 'SUPPLIER',
          verificationStatus: 'VERIFIED',
          isActive: true,
          OR: [
            { nameEn: { contains: term, mode: 'insensitive' } },
            { nameAr: { contains: term } },
            { city: { contains: term, mode: 'insensitive' } },
            { descriptionEn: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, nameEn: true, nameAr: true, logoUrl: true,
          city: true, plan: true, slug: true, verificationStatus: true,
          _count: { select: { listings: true } },
        },
        take: 5,
      }),

      this.prisma.listing.findMany({
        where: {
          status: 'ACTIVE',
          supplier: { verificationStatus: 'VERIFIED' },
          OR: [
            { titleEn: { contains: term, mode: 'insensitive' } },
            { titleAr: { contains: term } },
            { descriptionEn: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          titleEn: true,
          titleAr: true,
          price: true,
          currency: true,
          unit: true,
          supplier: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
          category: { select: { nameEn: true, nameAr: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        take: 8,
      }),

      this.prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { nameEn: { contains: term, mode: 'insensitive' } },
            { nameAr: { contains: term } },
          ],
        },
        select: { id: true, nameEn: true, nameAr: true, slug: true },
        take: 5,
      }),
    ]);

    return { companies, listings, categories };
  }

  async getMarketplaceStats() {
    const [totalRFQs, totalVendors, totalProducts, totalTransactions] = await Promise.all([
      this.prisma.rFQ.count(),
      this.prisma.company.count({ where: { type: 'SUPPLIER', verificationStatus: 'VERIFIED' } }),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.deal.count(),
    ]);

    return { totalRFQs, totalVendors, totalProducts, totalTransactions };
  }

  async getTopVendors(limit = 8) {
    const vendors = await this.prisma.company.findMany({
      where: { type: 'SUPPLIER', verificationStatus: 'VERIFIED', isActive: true },
      include: {
        ratingsReceived: { select: { score: true } },
        _count: { select: { listings: true, quotesSubmitted: true } },
      },
      take: 60,
    });

    return vendors
      .map((v) => {
        const { ratingsReceived, ...rest } = v;
        const totalRatings = ratingsReceived.length;
        const averageRating =
          totalRatings > 0
            ? Math.round(
                (ratingsReceived.reduce((s, r) => s + r.score, 0) / totalRatings) * 10,
              ) / 10
            : 0;
        return { ...rest, averageRating, totalRatings };
      })
      .sort((a, b) => {
        if (a.plan !== b.plan) return a.plan === 'PRO' ? -1 : 1;
        return b.averageRating - a.averageRating || b.totalRatings - a.totalRatings;
      })
      .slice(0, limit);
  }

  async getTopProducts(limit = 8) {
    const listings = await this.prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        supplier: { verificationStatus: 'VERIFIED' },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        supplier: {
          select: {
            id: true, nameEn: true, nameAr: true, slug: true,
            verificationStatus: true, plan: true,
          },
        },
        category: { select: { id: true, nameEn: true, nameAr: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 4,
    });

    return listings
      .sort((a, b) => b._count.quotes - a._count.quotes)
      .slice(0, limit);
  }

  async getFeaturedShowrooms(limit = 6) {
    const companies = await this.prisma.company.findMany({
      where: { type: 'SUPPLIER', verificationStatus: 'VERIFIED', isActive: true },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          include: { images: { where: { isPrimary: true }, take: 1 } },
          take: 4,
          orderBy: { createdAt: 'desc' },
        },
        ratingsReceived: { select: { score: true } },
        _count: { select: { listings: true } },
      },
      take: 40,
    });

    return companies
      .map((c) => {
        const { ratingsReceived, ...rest } = c;
        const totalRatings = ratingsReceived.length;
        const averageRating =
          totalRatings > 0
            ? Math.round(
                (ratingsReceived.reduce((s, r) => s + r.score, 0) / totalRatings) * 10,
              ) / 10
            : 0;
        return { ...rest, averageRating, totalRatings };
      })
      .sort((a, b) => {
        if (a.plan !== b.plan) return a.plan === 'PRO' ? -1 : 1;
        return b.averageRating - a.averageRating;
      })
      .slice(0, limit);
  }
}
