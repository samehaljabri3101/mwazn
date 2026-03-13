import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScoringService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scoring formula (0–100):
   *  30 pts — verified
   *  20 pts — PRO plan
   *  25 pts — average rating × 5  (5★ = 25)
   *  15 pts — deal completion rate
   *  10 pts — active listings (max at 20+ listings)
   */
  computeScore(params: {
    verified: boolean;
    isPro: boolean;
    avgRating: number;
    totalRatings: number;
    totalDeals: number;
    completedDeals: number;
    activeListings: number;
  }): number {
    const verifiedPts = params.verified ? 30 : 0;
    const proPts = params.isPro ? 20 : 0;
    const ratingPts = params.totalRatings > 0 ? Math.min(params.avgRating * 5, 25) : 0;
    const completionRate = params.totalDeals > 0 ? params.completedDeals / params.totalDeals : 0;
    const completionPts = Math.min(completionRate * 15, 15);
    const listingPts = Math.min((params.activeListings / 20) * 10, 10);

    return Math.round(verifiedPts + proPts + ratingPts + completionPts + listingPts);
  }

  async updateScoreForCompany(companyId: string): Promise<number> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        ratingsReceived: { select: { score: true } },
        dealsAsSupplier: { select: { status: true } },
        listings: { where: { status: 'ACTIVE' }, select: { id: true } },
      },
    });

    if (!company) return 0;

    const avgRating =
      company.ratingsReceived.length > 0
        ? company.ratingsReceived.reduce((s, r) => s + r.score, 0) / company.ratingsReceived.length
        : 0;

    const completedDeals = company.dealsAsSupplier.filter((d) => d.status === 'COMPLETED').length;

    const score = this.computeScore({
      verified: company.verificationStatus === 'VERIFIED',
      isPro: company.plan === 'PRO',
      avgRating,
      totalRatings: company.ratingsReceived.length,
      totalDeals: company.dealsAsSupplier.length,
      completedDeals,
      activeListings: company.listings.length,
    });

    const roundedAvg = company.ratingsReceived.length > 0
      ? Math.round(avgRating * 10) / 10
      : null;

    await this.prisma.company.update({
      where: { id: companyId },
      data: { supplierScore: score, avgRating: roundedAvg, scoreUpdatedAt: new Date() },
    });

    return score;
  }

  /**
   * On startup: backfill avgRating for any suppliers where it is still null.
   * Idempotent — once all suppliers have avgRating set this is a no-op.
   */
  async onApplicationBootstrap(): Promise<void> {
    const needsBackfill = await this.prisma.company.findMany({
      where: { type: 'SUPPLIER', isActive: true, avgRating: null },
      select: { id: true },
    });

    if (needsBackfill.length === 0) return;

    this.logger.log(`Backfilling scores for ${needsBackfill.length} suppliers…`);
    for (const s of needsBackfill) {
      await this.updateScoreForCompany(s.id);
    }
    this.logger.log(`Score backfill complete.`);
  }

  /** Daily cron at 2 AM: recompute all supplier scores */
  @Cron('0 2 * * *')
  async updateAllScores(): Promise<void> {
    const suppliers = await this.prisma.company.findMany({
      where: { type: 'SUPPLIER', isActive: true },
      select: { id: true },
    });

    let updated = 0;
    for (const s of suppliers) {
      await this.updateScoreForCompany(s.id);
      updated++;
    }

    this.logger.log(`Supplier scores updated: ${updated} companies`);
  }

  getTrustTier(company: { verificationStatus: string; plan: string; supplierScore?: number | null }): string {
    const score = company.supplierScore ?? 0;
    if (company.verificationStatus === 'VERIFIED' && company.plan === 'PRO' && score >= 75) return 'TOP_SUPPLIER';
    if (company.verificationStatus === 'VERIFIED' && score >= 50) return 'TRUSTED';
    if (company.verificationStatus === 'VERIFIED') return 'VERIFIED';
    return 'STANDARD';
  }

  async trackEvent(event: string, companyId?: string, userId?: string, entityId?: string, meta?: any) {
    await this.prisma.analyticsEvent.create({
      data: { event, companyId, userId, entityId, meta },
    });
  }

  async getEventCounts(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['event'],
      where: { createdAt: { gte: since } },
      _count: { event: true },
    });
    return events.reduce((acc, e) => ({ ...acc, [e.event]: e._count.event }), {} as Record<string, number>);
  }
}
