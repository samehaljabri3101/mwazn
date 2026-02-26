import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dealId: string, score: number, comment: string | undefined, userId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { rating: true },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    if (deal.status !== 'COMPLETED') {
      throw new BadRequestException('Can only rate completed deals');
    }
    if (deal.rating) throw new BadRequestException('Deal already rated');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== deal.buyerId) throw new ForbiddenException('Only the buyer can rate');

    if (score < 1 || score > 5) throw new BadRequestException('Score must be between 1 and 5');

    return this.prisma.rating.create({
      data: {
        dealId,
        score,
        comment,
        raterId: deal.buyerId,
        ratedId: deal.supplierId,
      },
      include: {
        rater: { select: { nameAr: true, nameEn: true } },
        rated: { select: { nameAr: true, nameEn: true } },
      },
    });
  }

  async findBySupplier(supplierId: string, query: PaginationDto) {
    const where = { ratedId: supplierId };
    const [items, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { rater: { select: { nameAr: true, nameEn: true } } },
      }),
      this.prisma.rating.count({ where }),
    ]);

    const avg = items.length > 0 ? items.reduce((s, r) => s + r.score, 0) / items.length : null;
    return { ...paginate(items, total, query.page ?? 1, query.limit ?? 20), averageScore: avg };
  }
}
