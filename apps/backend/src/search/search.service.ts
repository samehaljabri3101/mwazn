import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

interface SearchFilters {
  q?: string;
  type?: string;
  category?: string;
  city?: string;
  verified?: boolean;
  pro?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async search(q: string, type?: string) {
    const term = q?.trim() ?? '';
    if (term.length < 2) return { companies: [], listings: [], categories: [] };

    const cacheKey = `search:${term}:${type ?? 'all'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [companies, listings, categories] = await Promise.all([
      !type || type === 'suppliers'
        ? this.prisma.company.findMany({
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
              supplierScore: true,
              _count: { select: { listings: true } },
            },
            orderBy: [{ supplierScore: 'desc' }, { plan: 'desc' }],
            take: 8,
          })
        : [],

      !type || type === 'products'
        ? this.prisma.listing.findMany({
            where: {
              status: 'ACTIVE',
              supplier: { verificationStatus: 'VERIFIED' },
              OR: [
                { titleEn: { contains: term, mode: 'insensitive' } },
                { titleAr: { contains: term } },
                { descriptionEn: { contains: term, mode: 'insensitive' } },
                { tags: { has: term } },
              ],
            },
            select: {
              id: true, titleEn: true, titleAr: true, price: true,
              currency: true, unit: true, slug: true, stockAvailability: true,
              supplier: { select: { id: true, nameEn: true, nameAr: true, slug: true, verificationStatus: true } },
              category: { select: { nameEn: true, nameAr: true, slug: true } },
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
            take: 10,
          })
        : [],

      !type || type === 'categories'
        ? this.prisma.category.findMany({
            where: {
              isActive: true,
              OR: [
                { nameEn: { contains: term, mode: 'insensitive' } },
                { nameAr: { contains: term } },
              ],
            },
            select: {
              id: true, nameEn: true, nameAr: true, slug: true,
              _count: { select: { listings: true } },
            },
            take: 6,
          })
        : [],
    ]);

    const result = { companies, listings, categories };
    await this.cache.set(cacheKey, result, 30_000); // cache 30s
    return result;
  }

  async searchSuppliers(filters: SearchFilters) {
    const { q, category, city, verified, pro, minRating, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { type: 'SUPPLIER', isActive: true };

    if (verified !== false) where.verificationStatus = 'VERIFIED';
    if (pro === true) where.plan = 'PRO';
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (category) {
      where.listings = { some: { category: { slug: category }, status: 'ACTIVE' } };
    }
    if (q && q.trim().length >= 2) {
      where.OR = [
        { nameEn: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          ratingsReceived: { select: { score: true } },
          _count: { select: { listings: true, dealsAsSupplier: true } },
        },
        orderBy: [{ supplierScore: 'desc' }, { plan: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    const enriched = items
      .map((c) => {
        const { ratingsReceived, ...rest } = c;
        const totalRatings = ratingsReceived.length;
        const averageRating =
          totalRatings > 0
            ? Math.round((ratingsReceived.reduce((s, r) => s + r.score, 0) / totalRatings) * 10) / 10
            : 0;
        return { ...rest, averageRating, totalRatings };
      })
      .filter((c) => !minRating || c.averageRating >= minRating);

    return { items: enriched, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async searchListings(filters: SearchFilters) {
    const { q, category, city, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
      supplier: { verificationStatus: 'VERIFIED', isActive: true },
    };

    if (q && q.trim().length >= 2) {
      where.OR = [
        { titleEn: { contains: q, mode: 'insensitive' } },
        { titleAr: { contains: q } },
        { tags: { has: q } },
      ];
    }
    if (category) where.category = { slug: category };
    if (city) where.supplier = { ...where.supplier, city: { contains: city, mode: 'insensitive' } };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, nameEn: true, nameAr: true, slug: true, verificationStatus: true, plan: true, city: true },
          },
          category: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { quotes: true } },
        },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getMarketplaceStats() {
    const cacheKey = 'marketplace:stats';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [totalRFQs, totalVendors, totalProducts, totalTransactions] = await Promise.all([
      this.prisma.rFQ.count(),
      this.prisma.company.count({ where: { type: 'SUPPLIER', verificationStatus: 'VERIFIED' } }),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.deal.count(),
    ]);

    const result = { totalRFQs, totalVendors, totalProducts, totalTransactions };
    await this.cache.set(cacheKey, result, 300_000); // cache 5 min
    return result;
  }

  async getTopVendors(limit = 8) {
    const cacheKey = `marketplace:top-vendors:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const vendors = await this.prisma.company.findMany({
      where: { type: 'SUPPLIER', verificationStatus: 'VERIFIED', isActive: true },
      include: {
        ratingsReceived: { select: { score: true } },
        _count: { select: { listings: true, quotesSubmitted: true } },
      },
      orderBy: [{ supplierScore: 'desc' }, { plan: 'desc' }],
      take: limit * 3,
    });

    const result = vendors
      .map((v) => {
        const { ratingsReceived, ...rest } = v;
        const totalRatings = ratingsReceived.length;
        const averageRating =
          totalRatings > 0
            ? Math.round((ratingsReceived.reduce((s, r) => s + r.score, 0) / totalRatings) * 10) / 10
            : 0;
        return { ...rest, averageRating, totalRatings };
      })
      .sort((a, b) => {
        if (a.plan !== b.plan) return a.plan === 'PRO' ? -1 : 1;
        return b.averageRating - a.averageRating || b.totalRatings - a.totalRatings;
      })
      .slice(0, limit);

    await this.cache.set(cacheKey, result, 120_000); // cache 2 min
    return result;
  }

  async getTopProducts(limit = 8) {
    const cacheKey = `marketplace:top-products:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const listings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVE', supplier: { verificationStatus: 'VERIFIED' } },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        supplier: { select: { id: true, nameEn: true, nameAr: true, slug: true, verificationStatus: true, plan: true } },
        category: { select: { id: true, nameEn: true, nameAr: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      take: limit * 4,
    });

    const result = listings.sort((a, b) => b._count.quotes - a._count.quotes).slice(0, limit);
    await this.cache.set(cacheKey, result, 120_000);
    return result;
  }

  async getLatestRFQs(limit = 6) {
    const cacheKey = `marketplace:latest-rfqs:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const rfqs = await this.prisma.rFQ.findMany({
      where: { status: 'OPEN', visibility: 'PUBLIC' },
      include: {
        category: { select: { nameEn: true, nameAr: true, slug: true } },
        buyer: { select: { nameEn: true, nameAr: true, city: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    await this.cache.set(cacheKey, rfqs, 60_000); // cache 1 min
    return rfqs;
  }

  async getFeaturedShowrooms(limit = 6) {
    const cacheKey = `marketplace:showrooms:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

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
      orderBy: [{ supplierScore: 'desc' }, { plan: 'desc' }],
      take: limit * 4,
    });

    const result = companies
      .map((c) => {
        const { ratingsReceived, ...rest } = c;
        const totalRatings = ratingsReceived.length;
        const averageRating =
          totalRatings > 0
            ? Math.round((ratingsReceived.reduce((s, r) => s + r.score, 0) / totalRatings) * 10) / 10
            : 0;
        return { ...rest, averageRating, totalRatings };
      })
      .sort((a, b) => {
        if (a.plan !== b.plan) return a.plan === 'PRO' ? -1 : 1;
        return b.averageRating - a.averageRating;
      })
      .slice(0, limit);

    await this.cache.set(cacheKey, result, 120_000);
    return result;
  }
}
