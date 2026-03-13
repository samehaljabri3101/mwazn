import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

// ── Trust tier helpers ────────────────────────────────────────────────────────

const TRUST_BOOST: Record<string, number> = {
  TOP_SUPPLIER: 25,
  TRUSTED: 15,
  VERIFIED: 8,
  STANDARD: 0,
};

function getTrustTier(company: { verificationStatus?: string; plan?: string; supplierScore?: number | null }): string {
  const score = company.supplierScore ?? 0;
  if (company.verificationStatus === 'VERIFIED' && company.plan === 'PRO' && score >= 75) return 'TOP_SUPPLIER';
  if (company.verificationStatus === 'VERIFIED' && score >= 50) return 'TRUSTED';
  if (company.verificationStatus === 'VERIFIED') return 'VERIFIED';
  return 'STANDARD';
}

interface SearchFilters {
  q?: string;
  type?: string;
  category?: string;
  city?: string;
  verified?: boolean;
  pro?: boolean;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  trustTier?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // ── Ranking helpers ──────────────────────────────────────────────────────────

  private computeListingRankScore(listing: any): number {
    const tier = getTrustTier(listing.supplier ?? {});
    const trustBoostPts = TRUST_BOOST[tier] ?? 0;                                    // 0–25
    const trustScorePts = Math.round((listing.supplier?.supplierScore ?? 0) / 5);    // 0–20
    const ratingPts = Math.round(((listing.supplier?.avgRating ?? 0) / 5) * 15);     // 0–15
    const responsePts = Math.min((listing._count?.quotes ?? 0) * 2, 10);             // 0–10
    const activityPts = Math.min(Math.round((listing.viewCount ?? 0) / 50), 10);     // 0–10
    const recencyDays = (Date.now() - new Date(listing.createdAt).getTime()) / 86_400_000;
    const recencyPts = Math.max(0, 5 - Math.floor(recencyDays / 30));                // 0–5
    return trustBoostPts + trustScorePts + ratingPts + responsePts + activityPts + recencyPts;
  }

  private computeSupplierRankScore(supplier: any): number {
    const tier = getTrustTier(supplier);
    const trustBoostPts = TRUST_BOOST[tier] ?? 0;                                              // 0–25
    const trustScorePts = Math.round((supplier.supplierScore ?? 0) / 5);                       // 0–20
    const ratingPts = Math.round(((supplier.avgRating ?? supplier.averageRating ?? 0) / 5) * 15); // 0–15
    const dealPts = Math.min((supplier._count?.dealsAsSupplier ?? 0) * 3, 15);                 // 0–15
    const quotePts = Math.min((supplier._count?.quotesSubmitted ?? 0), 15);                    // 0–15
    const rfqPts = Math.min((supplier._count?.quotesSubmitted ?? 0) * 2, 10);                  // 0–10
    return trustBoostPts + trustScorePts + ratingPts + dealPts + quotePts + rfqPts;
  }

  // ── Observability ────────────────────────────────────────────────────────────

  private trackSearch(term: string, type: string, resultCount: number): void {
    this.prisma.analyticsEvent.create({
      data: { event: 'SEARCH', meta: { term, type, resultCount, zeroResults: resultCount === 0 } },
    }).catch(() => {});
  }

  // ── Typeahead suggestions ────────────────────────────────────────────────────

  async getSuggestions(q: string): Promise<any> {
    const term = q?.trim() ?? '';
    if (term.length < 2) return { products: [], suppliers: [], categories: [] };

    const cacheKey = `suggest:${term}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [products, suppliers, categories] = await Promise.all([
      this.prisma.listing.findMany({
        where: {
          status: 'ACTIVE', moderationStatus: 'ACTIVE',
          OR: [
            { titleEn: { contains: term, mode: 'insensitive' } },
            { titleAr: { contains: term } },
          ],
        },
        select: { id: true, titleEn: true, titleAr: true, slug: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
      this.prisma.company.findMany({
        where: {
          type: 'SUPPLIER', isActive: true, verificationStatus: 'VERIFIED',
          OR: [
            { nameEn: { contains: term, mode: 'insensitive' } },
            { nameAr: { contains: term } },
          ],
        },
        select: { id: true, nameEn: true, nameAr: true, slug: true, supplierScore: true },
        orderBy: { supplierScore: 'desc' },
        take: 4,
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
        take: 4,
      }),
    ]);

    const result = { products, suppliers, categories };
    await this.cache.set(cacheKey, result, 15_000); // 15s for typeahead freshness
    return result;
  }

  // ── Search analytics (admin observability) ───────────────────────────────────

  async getSearchAnalytics(days = 30): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.prisma.analyticsEvent.findMany({
      where: { event: 'SEARCH', createdAt: { gte: since } },
      select: { meta: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const termCounts: Record<string, number> = {};
    const zeroResultTerms: Set<string> = new Set();
    for (const e of events) {
      const m = e.meta as any;
      if (!m?.term) continue;
      termCounts[m.term] = (termCounts[m.term] ?? 0) + 1;
      if (m.zeroResults) zeroResultTerms.add(m.term);
    }

    const topTerms = Object.entries(termCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, count]) => ({ term, count }));

    return {
      totalSearches: events.length,
      topTerms,
      zeroResultQueries: Array.from(zeroResultTerms).slice(0, 20),
      period: `${days}d`,
    };
  }

  // ── Global search ────────────────────────────────────────────────────────────

  async search(q: string, type?: string) {
    const term = q?.trim() ?? '';
    if (term.length < 2) return { companies: [], listings: [], categories: [] };

    const cacheKey = `search:${term}:${type ?? 'all'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [rawCompanies, rawListings, categories] = await Promise.all([
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
              supplierScore: true, avgRating: true,
              _count: { select: { listings: true, quotesSubmitted: true, dealsAsSupplier: true } },
            },
            take: 20,
          })
        : [],

      !type || type === 'products'
        ? this.prisma.listing.findMany({
            where: {
              status: 'ACTIVE',
              moderationStatus: 'ACTIVE',
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
              viewCount: true, createdAt: true,
              supplier: {
                select: {
                  id: true, nameEn: true, nameAr: true, slug: true,
                  verificationStatus: true, plan: true,
                  supplierScore: true, avgRating: true,
                },
              },
              category: { select: { nameEn: true, nameAr: true, slug: true } },
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              _count: { select: { quotes: true } },
            },
            take: 30,
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

    // Apply trust-boosted ranking
    const companies = rawCompanies
      .map((c) => ({
        ...c,
        trustTier: getTrustTier(c),
        rankScore: this.computeSupplierRankScore(c),
      }))
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, 8);

    const listings = rawListings
      .map((l) => ({
        ...l,
        trustTier: getTrustTier((l.supplier as any) ?? {}),
        rankScore: this.computeListingRankScore(l),
      }))
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, 10);

    const totalResults = companies.length + listings.length + categories.length;
    this.trackSearch(term, type ?? 'all', totalResults);

    const result = { companies, listings, categories };
    await this.cache.set(cacheKey, result, 30_000);
    return result;
  }

  // ── Advanced supplier search ─────────────────────────────────────────────────

  async searchSuppliers(filters: SearchFilters) {
    const { q, category, city, verified, pro, minRating, trustTier, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { type: 'SUPPLIER', isActive: true };
    if (verified !== false) where.verificationStatus = 'VERIFIED';
    if (pro === true) where.plan = 'PRO';
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (category) {
      where.listings = { some: { category: { slug: category }, status: 'ACTIVE', moderationStatus: 'ACTIVE' } };
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
          _count: { select: { listings: true, dealsAsSupplier: true, quotesSubmitted: true } },
        },
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
        const tier = getTrustTier(c);
        const rankScore = this.computeSupplierRankScore({ ...rest, averageRating });
        return { ...rest, averageRating, totalRatings, trustTier: tier, rankScore };
      })
      .filter((c) => !minRating || c.averageRating >= minRating)
      .filter((c) => !trustTier || c.trustTier === trustTier);

    enriched.sort((a, b) => b.rankScore - a.rankScore);
    if (q) this.trackSearch(q, 'suppliers', enriched.length);

    return { items: enriched, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Advanced listing search ──────────────────────────────────────────────────

  async searchListings(filters: SearchFilters) {
    const { q, category, city, minPrice, maxPrice, trustTier, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
      moderationStatus: 'ACTIVE',
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
    if (minPrice !== undefined) where.price = { ...(where.price ?? {}), gte: minPrice };
    if (maxPrice !== undefined) where.price = { ...(where.price ?? {}), lte: maxPrice };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true, nameEn: true, nameAr: true, slug: true,
              verificationStatus: true, plan: true, city: true,
              supplierScore: true, avgRating: true,
            },
          },
          category: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { quotes: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const ranked = items
      .map((l) => {
        const tier = getTrustTier(l.supplier as any);
        return { ...l, trustTier: tier, rankScore: this.computeListingRankScore(l) };
      })
      .filter((l) => !trustTier || l.trustTier === trustTier)
      .sort((a, b) => b.rankScore - a.rankScore);

    if (q) this.trackSearch(q, 'listings', ranked.length);

    return { items: ranked, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Marketplace stats / homepage ─────────────────────────────────────────────

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
    await this.cache.set(cacheKey, result, 300_000);
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
        _count: { select: { listings: true, quotesSubmitted: true, dealsAsSupplier: true } },
      },
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
        const tier = getTrustTier(v);
        const rankScore = this.computeSupplierRankScore({ ...rest, averageRating });
        return { ...rest, averageRating, totalRatings, trustTier: tier, rankScore };
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, limit);

    await this.cache.set(cacheKey, result, 120_000);
    return result;
  }

  async getTopProducts(limit = 8) {
    const cacheKey = `marketplace:top-products:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const listings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVE', moderationStatus: 'ACTIVE', supplier: { verificationStatus: 'VERIFIED' } },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        supplier: {
          select: {
            id: true, nameEn: true, nameAr: true, slug: true,
            verificationStatus: true, plan: true,
            supplierScore: true, avgRating: true,
          },
        },
        category: { select: { id: true, nameEn: true, nameAr: true } },
        _count: { select: { quotes: true } },
      },
      take: limit * 4,
    });

    const result = listings
      .map((l) => ({
        ...l,
        trustTier: getTrustTier(l.supplier as any),
        rankScore: this.computeListingRankScore(l),
      }))
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, limit);

    await this.cache.set(cacheKey, result, 120_000);
    return result;
  }

  async getLatestRFQs(limit = 6) {
    const cacheKey = `marketplace:latest-rfqs:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const rfqs = await this.prisma.rFQ.findMany({
      where: { status: 'OPEN', visibility: 'PUBLIC', moderationStatus: 'ACTIVE' },
      include: {
        category: { select: { nameEn: true, nameAr: true, slug: true } },
        buyer: { select: { nameEn: true, nameAr: true, city: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    await this.cache.set(cacheKey, rfqs, 60_000);
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
          where: { status: 'ACTIVE', moderationStatus: 'ACTIVE' },
          include: { images: { where: { isPrimary: true }, take: 1 } },
          take: 4,
          orderBy: { createdAt: 'desc' },
        },
        ratingsReceived: { select: { score: true } },
        _count: { select: { listings: true, quotesSubmitted: true, dealsAsSupplier: true } },
      },
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
        const tier = getTrustTier(c);
        const rankScore = this.computeSupplierRankScore({ ...rest, averageRating });
        return { ...rest, averageRating, totalRatings, trustTier: tier, rankScore };
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, limit);

    await this.cache.set(cacheKey, result, 120_000);
    return result;
  }
}
