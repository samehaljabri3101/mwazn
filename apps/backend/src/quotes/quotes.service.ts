import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { QuoteStatus, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/quote.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

const FREE_QUOTA = 3;

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
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

    const [items, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        include: { rfq: { include: { buyer: { select: { nameAr: true, nameEn: true } }, category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return paginate(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async create(dto: CreateQuoteDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    if (!user || user.company.type !== 'SUPPLIER') {
      throw new ForbiddenException('Only suppliers can submit quotes');
    }
    if (user.company.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('Your company must be verified to submit quotes');
    }

    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: dto.rfqId },
      include: { buyer: { include: { users: { select: { email: true }, take: 1 } } } },
    });
    if (!rfq || rfq.status !== 'OPEN') throw new BadRequestException('RFQ is not open');

    // Quota check for FREE plan
    if (user.company.plan === 'FREE') {
      const now = new Date();
      const resetAt = user.company.quotaResetAt;

      let needsReset = !resetAt || resetAt < new Date(now.getFullYear(), now.getMonth(), 1);
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

    // Notify buyer
    const buyerEmail = rfq.buyer.users[0]?.email;
    if (buyerEmail) await this.email.sendQuoteReceived(buyerEmail, rfq.title);

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

    return this.prisma.quote.update({ where: { id: quoteId }, data: { status: QuoteStatus.WITHDRAWN } });
  }

  private async changeStatus(quoteId: string, userId: string, status: QuoteStatus) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true, supplier: { include: { users: { select: { email: true }, take: 1 } } } },
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

      const supplierEmail = quote.supplier.users[0]?.email;
      if (supplierEmail) await this.email.sendQuoteAccepted(supplierEmail, quote.rfq.title);
    }

    return updated;
  }
}
