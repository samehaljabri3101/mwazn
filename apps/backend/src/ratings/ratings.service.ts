import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  async create(dealId: string, score: number, comment: string | undefined, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new ForbiddenException('User not found');

    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { ratings: true },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    if (deal.status !== 'COMPLETED') {
      throw new BadRequestException('Can only rate completed deals');
    }

    const companyId = user.companyId;
    const isBuyer = companyId === deal.buyerId;
    const isSupplier = companyId === deal.supplierId;

    if (!isBuyer && !isSupplier) {
      throw new ForbiddenException('Only deal participants can rate');
    }

    // Check if this company has already rated this deal
    const existingRating = deal.ratings.find((r) => r.raterId === companyId);
    if (existingRating) throw new BadRequestException('You have already rated this deal');

    if (score < 1 || score > 5) throw new BadRequestException('Score must be between 1 and 5');

    // Buyer rates supplier, supplier rates buyer
    const ratedId = isBuyer ? deal.supplierId : deal.buyerId;

    const rating = await this.prisma.rating.create({
      data: {
        dealId,
        score,
        comment,
        raterId: companyId,
        ratedId,
      },
      include: {
        rater: { select: { nameAr: true, nameEn: true } },
        rated: { select: { nameAr: true, nameEn: true } },
      },
    });

    // Recompute composite platformScore + avgRating for the rated supplier
    if (isBuyer) {
      await this.scoring.updateScoreForCompany(ratedId);
    }

    return rating;
  }

  async findBySupplier(supplierId: string, query: PaginationDto) {
    const where = { ratedId: supplierId };
    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
        include: { rater: { select: { nameAr: true, nameEn: true } } },
      }),
      this.prisma.rating.count({ where }),
    ]);

    const avg = items.length > 0 ? items.reduce((s, r) => s + r.score, 0) / items.length : null;
    return { ...paginate(items, total, _page, _limit), averageScore: avg };
  }

  async flagDisputed(ratingId: string, userId: string, reason?: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    const rating = await this.prisma.rating.findUnique({ where: { id: ratingId } });
    if (!rating) throw new NotFoundException('Rating not found');

    // Only the rated company (supplier who received the rating) can dispute it
    if (rating.ratedId !== user.companyId) {
      throw new ForbiddenException('Only the rated party can flag a rating as disputed');
    }

    if (rating.isDisputed) {
      throw new BadRequestException('Rating is already flagged as disputed');
    }

    return this.prisma.rating.update({
      where: { id: ratingId },
      data: {
        isDisputed: true,
        disputedAt: new Date(),
        disputeReason: reason ?? null,
        disputeStatus: 'PENDING_REVIEW',
      },
    });
  }

  // ── Admin: list all disputed ratings ─────────────────────────────────────────

  async getDisputedRatings(query: PaginationDto): Promise<any> {
    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const where = { isDisputed: true };
    const [items, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { disputedAt: 'desc' },
        include: {
          rater:  { select: { nameAr: true, nameEn: true } },
          rated:  { select: { nameAr: true, nameEn: true } },
          deal:   { select: { id: true } },
        },
      }),
      this.prisma.rating.count({ where }),
    ]);
    return { ...paginate(items, total, _page, _limit) };
  }

  // ── Admin: resolve a disputed rating ─────────────────────────────────────────

  async adminResolveDispute(ratingId: string, action: 'ACCEPT' | 'REJECT'): Promise<any> {
    const rating = await this.prisma.rating.findUnique({ where: { id: ratingId } });
    if (!rating) throw new NotFoundException('Rating not found');
    if (!rating.isDisputed) throw new BadRequestException('Rating is not disputed');

    // ACCEPT → dispute upheld, rating excluded from score (ACCEPTED)
    // REJECT → dispute denied, rating included back in score (REJECTED)
    const disputeStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    const updated = await this.prisma.rating.update({
      where: { id: ratingId },
      data: { disputeStatus },
    });

    // Recompute supplier score since dispute resolution changes which ratings count
    await this.scoring.updateScoreForCompany(rating.ratedId);

    return updated;
  }

  async findForBuyer(buyerId: string, query: PaginationDto) {
    const where = { ratedId: buyerId };
    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
        include: { rater: { select: { nameAr: true, nameEn: true } } },
      }),
      this.prisma.rating.count({ where }),
    ]);

    const avg = items.length > 0 ? items.reduce((s, r) => s + r.score, 0) / items.length : null;
    return { ...paginate(items, total, _page, _limit), averageScore: avg };
  }
}
