import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyType, VerificationStatus, ListingStatus, DealStatus } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalRFQs, totalVendors, totalProducts, totalTransactions] = await Promise.all([
      this.prisma.rFQ.count(),
      this.prisma.company.count({
        where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.VERIFIED },
      }),
      this.prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      this.prisma.deal.count({
        where: { status: { in: [DealStatus.COMPLETED, DealStatus.DELIVERED] } },
      }),
    ]);
    return { totalRFQs, totalVendors, totalProducts, totalTransactions };
  }

  async getTopVendors(limit = 8) {
    const companies = await this.prisma.company.findMany({
      where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.VERIFIED },
      take: limit,
      orderBy: { listings: { _count: 'desc' } },
      include: {
        ratingsReceived: { select: { score: true } },
        _count: { select: { listings: { where: { status: ListingStatus.ACTIVE } } } },
      },
    });

    return companies.map((c) => {
      const scores = c.ratingsReceived.map((r) => r.score);
      const averageRating =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return {
        id: c.id,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        city: c.city,
        plan: c.plan,
        slug: c.slug,
        logoUrl: c.logoUrl,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: scores.length,
        _count: { listings: c._count.listings },
      };
    });
  }

  async getTopProducts(limit = 8) {
    const listings = await this.prisma.listing.findMany({
      where: { status: ListingStatus.ACTIVE },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        supplier: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        category: { select: { nameAr: true, nameEn: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
        _count: { select: { quotes: true } },
      },
    });

    return listings.map((l) => ({
      id: l.id,
      titleEn: l.titleEn,
      titleAr: l.titleAr,
      price: l.price ? l.price.toString() : null,
      currency: l.currency,
      unit: l.unit,
      supplier: {
        id: l.supplier.id,
        nameEn: l.supplier.nameEn,
        nameAr: l.supplier.nameAr,
        slug: l.supplier.slug,
      },
      category: {
        nameEn: l.category.nameEn,
        nameAr: l.category.nameAr,
      },
      images: l.images.map((img) => ({ url: img.url })),
      _count: { quotes: l._count.quotes },
    }));
  }

  async getFeaturedShowrooms(limit = 6) {
    const companies = await this.prisma.company.findMany({
      where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.VERIFIED },
      take: limit,
      orderBy: { listings: { _count: 'desc' } },
      include: {
        ratingsReceived: { select: { score: true } },
        listings: {
          where: { status: ListingStatus.ACTIVE },
          take: 4,
          select: {
            id: true,
            titleEn: true,
            titleAr: true,
            images: {
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
              take: 1,
              select: { url: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { listings: { where: { status: ListingStatus.ACTIVE } } } },
      },
    });

    return companies.map((c) => {
      const scores = c.ratingsReceived.map((r) => r.score);
      const averageRating =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return {
        id: c.id,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        city: c.city,
        plan: c.plan,
        slug: c.slug,
        logoUrl: c.logoUrl,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: scores.length,
        _count: { listings: c._count.listings },
        listings: c.listings.map((l) => ({
          id: l.id,
          titleEn: l.titleEn,
          titleAr: l.titleAr,
          images: l.images.map((img) => ({ url: img.url })),
        })),
      };
    });
  }
}
