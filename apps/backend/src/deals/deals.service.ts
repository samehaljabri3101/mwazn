import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DealStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(userId: string, query: PaginationDto & { status?: DealStatus }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });

    const where: any = {};
    if (query.status) where.status = query.status;

    if (user?.role !== Role.PLATFORM_ADMIN) {
      if (user?.company.type === 'BUYER') where.buyerId = user.companyId;
      else where.supplierId = user?.companyId;
    }

    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
        include: {
          quote: { include: { rfq: true } },
          buyer: { select: { id: true, nameAr: true, nameEn: true } },
          supplier: { select: { id: true, nameAr: true, nameEn: true } },
          ratings: true,
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return paginate(items, total, _page, _limit);
  }

  async findOne(id: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        quote: { include: { rfq: true, attachments: true } },
        buyer: { select: { id: true, nameAr: true, nameEn: true, city: true } },
        supplier: { select: { id: true, nameAr: true, nameEn: true, city: true } },
        ratings: true,
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

  async updateStatus(id: string, status: DealStatus, userId: string, notes?: string, trackingNumber?: string, carrierName?: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        buyer: { include: { users: { select: { id: true, email: true }, take: 5 } } },
        supplier: { include: { users: { select: { id: true, email: true }, take: 5 } } },
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

    const shippingData: Record<string, unknown> = {};
    if (status === DealStatus.DELIVERED) {
      shippingData.shippedAt = new Date();
      if (trackingNumber) shippingData.trackingNumber = trackingNumber;
      if (carrierName) shippingData.carrierName = carrierName;
    }
    if (status === DealStatus.COMPLETED) {
      shippingData.deliveredAt = new Date();
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data: { status, notes: notes ?? deal.notes, ...shippingData },
    });

    const statusMapEn: Record<string, string> = {
      IN_PROGRESS: 'In Progress', DELIVERED: 'Delivered', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
    };
    const statusMapAr: Record<string, string> = {
      IN_PROGRESS: 'قيد التنفيذ', DELIVERED: 'تم التسليم', COMPLETED: 'مكتملة', CANCELLED: 'ملغاة',
    };

    // Notify both parties
    const allUsers = [
      ...deal.buyer.users.map((u) => ({ ...u, party: 'buyer' as const })),
      ...deal.supplier.users.map((u) => ({ ...u, party: 'supplier' as const })),
    ];

    for (const u of allUsers) {
      await this.email.sendDealStatusChanged(u.email, id, status);
      await this.notifications.create(
        u.id,
        'DEAL_STATUS',
        `تحديث حالة الصفقة: ${statusMapAr[status] || status}`,
        `Deal Status: ${statusMapEn[status] || status}`,
        `تم تحديث الصفقة إلى "${statusMapAr[status] || status}"`,
        `Your deal has been updated to "${statusMapEn[status] || status}"`,
        `/dashboard/${u.party === 'buyer' ? 'buyer' : 'supplier'}/deals`,
      );
    }

    return updated;
  }
}
