import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DealStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

const TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  AWARDED:     [DealStatus.IN_PROGRESS, DealStatus.CANCELLED],
  IN_PROGRESS: [DealStatus.DELIVERED,  DealStatus.CANCELLED],
  DELIVERED:   [DealStatus.COMPLETED,  DealStatus.CANCELLED],
  COMPLETED:   [],
  CANCELLED:   [],
};

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async findAll(userId: string, query: PaginationDto & { status?: DealStatus }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });

    const where: any = {};
    if (query.status) where.status = query.status;

    if (user?.role !== Role.PLATFORM_ADMIN) {
      if (user?.company.type === 'BUYER') where.buyerId = user.companyId;
      else where.supplierId = user?.companyId;
    }

    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          quote: { include: { rfq: true } },
          buyer: { select: { id: true, nameAr: true, nameEn: true } },
          supplier: { select: { id: true, nameAr: true, nameEn: true } },
          rating: true,
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return paginate(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        quote: { include: { rfq: true, attachments: true } },
        buyer: { select: { id: true, nameAr: true, nameEn: true, city: true } },
        supplier: { select: { id: true, nameAr: true, nameEn: true, city: true } },
        rating: true,
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      user?.role !== Role.PLATFORM_ADMIN &&
      user?.companyId !== deal.buyerId &&
      user?.companyId !== deal.supplierId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return deal;
  }

  async updateStatus(id: string, status: DealStatus, userId: string, notes?: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        buyer: { include: { users: { select: { email: true }, take: 1 } } },
        supplier: { include: { users: { select: { email: true }, take: 1 } } },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      user?.role !== Role.PLATFORM_ADMIN &&
      user?.companyId !== deal.buyerId &&
      user?.companyId !== deal.supplierId
    ) {
      throw new ForbiddenException();
    }

    const allowed = TRANSITIONS[deal.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${deal.status} to ${status}`);
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data: { status, notes: notes ?? deal.notes },
    });

    // Notify both parties
    const buyerEmail = deal.buyer.users[0]?.email;
    const supplierEmail = deal.supplier.users[0]?.email;
    if (buyerEmail) await this.email.sendDealStatusChanged(buyerEmail, id, status);
    if (supplierEmail) await this.email.sendDealStatusChanged(supplierEmail, id, status);

    return updated;
  }
}
