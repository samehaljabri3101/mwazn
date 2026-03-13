import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ModerationStatus, ModerationSource, RFQStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateRFQDto, UpdateRFQDto } from './dto/rfq.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { RFQ_POSTER_ROLES } from '../common/constants/platform.constants';

@Injectable()
export class RFQsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly moderation: ModerationService,
  ) {}

  async findAll(query: PaginationDto & { categoryId?: string; status?: RFQStatus; buyerId?: string; search?: string; adminOverride?: boolean; moderationStatus?: string }) {
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

    // PLATFORM_ADMIN sees all RFQs; all other callers see only PUBLIC + ACTIVE moderation
    if (!query.buyerId && !query.adminOverride) {
      where.visibility = 'PUBLIC';
      where.moderationStatus = ModerationStatus.ACTIVE;
    }
    // Admin can filter by moderationStatus explicitly
    if (query.adminOverride && query.moderationStatus) {
      where.moderationStatus = query.moderationStatus;
    }

    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          buyer: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true, city: true } },
          _count: { select: { quotes: true } },
        },
      }),
      this.prisma.rFQ.count({ where }),
    ]);

    return paginate(items, total, _page, _limit);
  }

  async findOne(id: string, callerUserId?: string) {
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

    // Guard: non-ACTIVE moderation → only owner or admin may see it
    if (rfq.moderationStatus !== ModerationStatus.ACTIVE) {
      let allowed = false;
      if (callerUserId) {
        const caller = await this.prisma.user.findUnique({
          where: { id: callerUserId },
          select: { role: true, companyId: true },
        });
        allowed = caller?.role === Role.PLATFORM_ADMIN || caller?.companyId === rfq.buyerId;
      }
      if (!allowed) throw new NotFoundException('RFQ not found');
    }

    return rfq;
  }

  async create(dto: CreateRFQDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    if (!user || !RFQ_POSTER_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only buyers and freelancers can create RFQs');
    }

    // Content moderation
    const modResult = this.moderation.moderate({ title: dto.title, description: dto.description });
    if (modResult.decision === 'BLOCK') {
      await this.audit.log({
        action: 'RFQ_BLOCKED_BY_SYSTEM',
        entity: 'RFQ',
        userId: user.id,
        after: { reasonCode: modResult.reasonCode, matchedTerms: modResult.matchedTerms, companyId: user.companyId },
      });
      throw new BadRequestException('Content violates platform guidelines');
    }

    const moderationStatus = modResult.decision === 'FLAG'
      ? ModerationStatus.FLAGGED
      : ModerationStatus.ACTIVE;

    const rfq = await this.prisma.rFQ.create({
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
        projectType: dto.projectType,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        budgetUndisclosed: dto.budgetUndisclosed ?? false,
        vatIncluded: dto.vatIncluded ?? false,
        expectedStartDate: dto.expectedStartDate ? new Date(dto.expectedStartDate) : null,
        locationRequirement: dto.locationRequirement,
        siteVisitRequired: dto.siteVisitRequired ?? false,
        ndaRequired: dto.ndaRequired ?? false,
        requiredCertifications: dto.requiredCertifications ?? [],
        visibility: dto.visibility ?? 'PUBLIC',
        allowPartialBids: dto.allowPartialBids ?? true,
        moderationStatus,
        moderationSource: moderationStatus === ModerationStatus.FLAGGED ? ModerationSource.SYSTEM : undefined,
        moderationReason: moderationStatus === ModerationStatus.FLAGGED ? modResult.reasonCode : undefined,
      },
      include: { category: true, buyer: { select: { id: true, nameAr: true, nameEn: true } } },
    });

    const auditAction = moderationStatus === ModerationStatus.FLAGGED ? 'RFQ_FLAGGED_BY_SYSTEM' : 'RFQ_CREATED';
    await this.audit.log({
      action: auditAction,
      entity: 'RFQ',
      entityId: rfq.id,
      userId: user.id,
      after: {
        actorRole: user.role,
        companyId: user.companyId,
        title: rfq.title,
        ...(moderationStatus === ModerationStatus.FLAGGED && { reasonCode: modResult.reasonCode }),
      },
    });

    return rfq;
  }

  async update(id: string, dto: UpdateRFQDto, userId: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== rfq.buyerId) {
      throw new ForbiddenException('Cannot modify another buyer\'s RFQ');
    }

    const updateData: any = { ...dto };
    if (dto.deadline) updateData.deadline = new Date(dto.deadline);

    // Re-run moderation if text content is changing
    if (dto.title !== undefined || dto.description !== undefined) {
      const modResult = this.moderation.moderate({
        title: dto.title ?? rfq.title,
        description: dto.description ?? rfq.description,
      });
      if (modResult.decision === 'BLOCK') {
        await this.audit.log({
          action: 'RFQ_BLOCKED_BY_SYSTEM',
          entity: 'RFQ',
          entityId: id,
          userId,
          after: { reasonCode: modResult.reasonCode, matchedTerms: modResult.matchedTerms, event: 'UPDATE' },
        });
        throw new BadRequestException('Content violates platform guidelines');
      }
      if (modResult.decision === 'FLAG') {
        updateData.moderationStatus = ModerationStatus.FLAGGED;
        updateData.moderationReason = modResult.reasonCode;
        updateData.moderationSource = ModerationSource.SYSTEM;
        await this.audit.log({
          action: 'RFQ_FLAGGED_BY_SYSTEM',
          entity: 'RFQ',
          entityId: id,
          userId,
          after: { reasonCode: modResult.reasonCode, event: 'UPDATE' },
        });
      }
    }

    return this.prisma.rFQ.update({ where: { id }, data: updateData });
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
