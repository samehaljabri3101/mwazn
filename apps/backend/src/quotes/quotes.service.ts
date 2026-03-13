import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { QuoteStatus, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/quote.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { SELLER_ROLES } from '../common/constants/platform.constants';

const FREE_QUOTA = 10;

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async findByRFQ(rfqId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    const where: any = { rfqId };

    // Suppliers only see their own quotes
    if (user?.company.type === 'SUPPLIER') where.supplierId = user.companyId;

    return this.prisma.quote.findMany({
      where,
      include: {
        supplier: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true, city: true, plan: true } },
        attachments: true,
      },
      orderBy: { price: 'asc' },
    });
  }

  async findMyQuotes(userId: string, query: PaginationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const where = { supplierId: user?.companyId };

    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        include: { rfq: { include: { buyer: { select: { nameAr: true, nameEn: true } }, category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return paginate(items, total, _page, _limit);
  }

  async create(dto: CreateQuoteDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    if (!user || !SELLER_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only suppliers can submit quotes');
    }
    if (user.company.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('Your company must be verified to submit quotes');
    }

    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: dto.rfqId },
      include: { buyer: { include: { users: { select: { id: true, email: true }, take: 5 } } } },
    });
    if (!rfq || rfq.status !== 'OPEN') throw new BadRequestException('RFQ is not open');

    // Quota check for FREE plan
    if (user.company.plan === 'FREE') {
      const now = new Date();
      const resetAt = user.company.quotaResetAt;

      const needsReset = !resetAt || resetAt < new Date(now.getFullYear(), now.getMonth(), 1);
      if (needsReset) {
        await this.prisma.company.update({
          where: { id: user.companyId },
          data: { quotesUsedThisMonth: 0, quotaResetAt: now },
        });
        user.company.quotesUsedThisMonth = 0;
      }

      if (user.company.quotesUsedThisMonth >= FREE_QUOTA) {
        throw new BadRequestException(`FREE plan allows only ${FREE_QUOTA} quotes/month. Upgrade to PRO for unlimited.`);
      }
    }

    // Check duplicate
    const existing = await this.prisma.quote.findFirst({
      where: { rfqId: dto.rfqId, supplierId: user.companyId, status: { not: QuoteStatus.WITHDRAWN } },
    });
    if (existing) throw new BadRequestException('You already submitted a quote for this RFQ');

    const quote = await this.prisma.quote.create({
      data: {
        rfqId: dto.rfqId,
        supplierId: user.companyId,
        price: dto.price,
        currency: dto.currency || 'SAR',
        deliveryDays: dto.deliveryDays,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        listingId: dto.listingId,
      },
      include: { supplier: { select: { nameAr: true, nameEn: true } }, rfq: true },
    });

    // Increment usage counter
    if (user.company.plan === 'FREE') {
      await this.prisma.company.update({
        where: { id: user.companyId },
        data: { quotesUsedThisMonth: { increment: 1 } },
      });
    }

    await this.audit.log({
      action: 'QUOTE_CREATED',
      entity: 'Quote',
      entityId: quote.id,
      userId: user.id,
      after: { actorRole: user.role, supplierId: user.companyId, rfqId: dto.rfqId, price: dto.price },
    });

    // Notify buyer (email + in-app)
    for (const buyerUser of rfq.buyer.users) {
      await this.email.sendQuoteReceived(buyerUser.email, rfq.title);
      await this.notifications.create(
        buyerUser.id,
        'QUOTE_RECEIVED',
        'عرض سعر جديد',
        'New Quote Received',
        `قدّم مورد عرض سعر على طلبك "${rfq.title}"`,
        `A supplier submitted a quote for your RFQ "${rfq.title}"`,
        `/dashboard/buyer/rfqs/${rfq.id}`,
      );
    }

    return quote;
  }

  async accept(quoteId: string, userId: string) {
    return this.changeStatus(quoteId, userId, QuoteStatus.ACCEPTED);
  }

  async reject(quoteId: string, userId: string) {
    return this.changeStatus(quoteId, userId, QuoteStatus.REJECTED);
  }

  async withdraw(quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== quote.supplierId) throw new ForbiddenException();

    const withdrawn = await this.prisma.quote.update({ where: { id: quoteId }, data: { status: QuoteStatus.WITHDRAWN } });

    await this.audit.log({
      action: 'QUOTE_WITHDRAWN',
      entity: 'Quote',
      entityId: quoteId,
      userId,
      after: { supplierId: quote.supplierId, rfqId: quote.rfqId },
    });

    return withdrawn;
  }

  private async changeStatus(quoteId: string, userId: string, status: QuoteStatus) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        rfq: true,
        supplier: { include: { users: { select: { id: true, email: true }, take: 5 } } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== quote.rfq.buyerId) {
      throw new ForbiddenException('Only the buyer or admin can accept/reject quotes');
    }

    const updated = await this.prisma.quote.update({ where: { id: quoteId }, data: { status } });

    if (status === QuoteStatus.ACCEPTED) {
      // Award the RFQ and create a deal
      await this.prisma.rFQ.update({ where: { id: quote.rfqId }, data: { status: 'AWARDED' } });

      await this.prisma.deal.create({
        data: {
          quoteId,
          buyerId: quote.rfq.buyerId,
          supplierId: quote.supplierId,
          totalAmount: quote.price,
          currency: quote.currency,
        },
      });

      // Notify supplier users (email + in-app)
      for (const supplierUser of quote.supplier.users) {
        await this.email.sendQuoteAccepted(supplierUser.email, quote.rfq.title);
        await this.notifications.create(
          supplierUser.id,
          'QUOTE_ACCEPTED',
          'تم قبول عرضك!',
          'Quote Accepted!',
          `تم قبول عرض سعرك على "${quote.rfq.title}". تم إنشاء صفقة جديدة.`,
          `Your quote for "${quote.rfq.title}" was accepted. A deal has been created.`,
          `/dashboard/supplier/deals`,
        );
      }
    }

    await this.audit.log({
      action: status === QuoteStatus.ACCEPTED ? 'QUOTE_ACCEPTED' : 'QUOTE_REJECTED',
      entity: 'Quote',
      entityId: quoteId,
      userId,
      after: { newStatus: status, rfqId: quote.rfqId, supplierId: quote.supplierId, price: quote.price },
    });

    return updated;
  }
}
