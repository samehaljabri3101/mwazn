import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RFQStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRFQDto, UpdateRFQDto } from './dto/rfq.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class RFQsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: PaginationDto & { categoryId?: string; status?: RFQStatus; buyerId?: string; search?: string }) {
    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.buyerId) where.buyerId = query.buyerId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          buyer: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true, city: true } },
          _count: { select: { quotes: true } },
        },
      }),
      this.prisma.rFQ.count({ where }),
    ]);

    return paginate(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: {
        category: true,
        buyer: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true, city: true } },
        quotes: {
          include: {
            supplier: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { quotes: true } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async create(dto: CreateRFQDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    if (!user || user.company.type !== 'BUYER') {
      throw new ForbiddenException('Only buyers can create RFQs');
    }

    return this.prisma.rFQ.create({
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        quantity: dto.quantity,
        unit: dto.unit,
        budget: dto.budget,
        currency: dto.currency || 'SAR',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        buyerId: user.companyId,
      },
      include: { category: true, buyer: { select: { id: true, nameAr: true, nameEn: true } } },
    });
  }

  async update(id: string, dto: UpdateRFQDto, userId: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== rfq.buyerId) {
      throw new ForbiddenException('Cannot modify another buyer\'s RFQ');
    }

    return this.prisma.rFQ.update({
      where: { id },
      data: { ...dto, deadline: dto.deadline ? new Date(dto.deadline) : undefined },
    });
  }

  async cancel(id: string, userId: string) {
    return this.update(id, { status: RFQStatus.CANCELLED }, userId);
  }

  async getMyRFQs(userId: string, query: PaginationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.findAll(Object.assign(query, { buyerId: user?.companyId }));
  }

  async inviteSupplier(rfqId: string, supplierId: string, buyerUserId: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { buyer: true },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const buyerUser = await this.prisma.user.findUnique({ where: { id: buyerUserId } });
    if (buyerUser?.companyId !== rfq.buyerId && buyerUser?.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only the RFQ buyer can invite suppliers');
    }

    const supplier = await this.prisma.company.findUnique({
      where: { id: supplierId },
      include: { users: { select: { id: true, email: true }, take: 5 } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    // Upsert to avoid duplicates (@@unique[rfqId, supplierId])
    const existing = await this.prisma.rFQInvite.findUnique({
      where: { rfqId_supplierId: { rfqId, supplierId } },
    });
    if (existing) throw new BadRequestException('Supplier already invited');

    const invite = await this.prisma.rFQInvite.create({
      data: { rfqId, supplierId, invitedBy: buyerUserId },
    });

    // Notify all supplier users
    for (const supplierUser of supplier.users) {
      await this.email.sendRFQInvite(supplierUser.email, rfq.title, rfqId);
      await this.notifications.create(
        supplierUser.id,
        'INVITE',
        'دعوة لتقديم عرض سعر',
        'RFQ Invitation',
        `تمت دعوتك لتقديم عرض سعر على "${rfq.title}"`,
        `You've been invited to submit a quote for "${rfq.title}"`,
        `/dashboard/supplier/rfqs`,
      );
    }

    return invite;
  }

  async getInvites(rfqId: string) {
    return this.prisma.rFQInvite.findMany({
      where: { rfqId },
      include: {
        supplier: {
          select: { id: true, nameAr: true, nameEn: true, city: true, plan: true, verificationStatus: true, logoUrl: true },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }
}
