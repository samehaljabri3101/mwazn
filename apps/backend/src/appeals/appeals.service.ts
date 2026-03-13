import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AppealStatus, AppealTargetType, ModerationStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { AdminRespondAppealDto } from './dto/admin-respond-appeal.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class AppealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateAppealDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException();

    // Verify ownership and get current moderation status
    let originalModerationStatus: ModerationStatus;
    if (dto.targetType === AppealTargetType.RFQ) {
      const rfq = await this.prisma.rFQ.findUnique({ where: { id: dto.targetId } });
      if (!rfq) throw new NotFoundException('RFQ not found');
      if (rfq.buyerId !== user.companyId) throw new ForbiddenException('You do not own this RFQ');
      if (rfq.moderationStatus === ModerationStatus.ACTIVE) {
        throw new BadRequestException('This RFQ is not moderated');
      }
      originalModerationStatus = rfq.moderationStatus;
    } else {
      const listing = await this.prisma.listing.findUnique({ where: { id: dto.targetId } });
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.supplierId !== user.companyId) throw new ForbiddenException('You do not own this listing');
      if (listing.moderationStatus === ModerationStatus.ACTIVE) {
        throw new BadRequestException('This listing is not moderated');
      }
      originalModerationStatus = listing.moderationStatus;
    }

    // Check no open appeal already exists
    const existing = await this.prisma.moderationAppeal.findFirst({
      where: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        appealStatus: { in: [AppealStatus.OPEN, AppealStatus.UNDER_REVIEW] },
      },
    });
    if (existing) throw new BadRequestException('An appeal is already open for this content');

    const appeal = await this.prisma.moderationAppeal.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        appellantUserId: userId,
        appellantCompanyId: user.companyId,
        originalModerationStatus,
        reason: dto.reason,
      },
    });

    await this.audit.log({
      action: 'APPEAL_SUBMITTED',
      entity: 'ModerationAppeal',
      entityId: appeal.id,
      userId,
      after: { targetType: dto.targetType, targetId: dto.targetId },
    });

    return appeal;
  }

  async findMyAppeals(userId: string, query: PaginationDto) {
    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const where = { appellantUserId: userId };
    const [items, total] = await Promise.all([
      this.prisma.moderationAppeal.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.moderationAppeal.count({ where }),
    ]);
    const enriched = await this.enrichWithTargetData(items);
    return paginate(enriched, total, _page, _limit);
  }

  async findOne(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const appeal = await this.prisma.moderationAppeal.findUnique({ where: { id } });
    if (!appeal) throw new NotFoundException('Appeal not found');
    if (user?.role !== Role.PLATFORM_ADMIN && appeal.appellantUserId !== userId) {
      throw new ForbiddenException();
    }
    return appeal;
  }

  async adminFindAll(query: PaginationDto & { status?: AppealStatus }) {
    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const where: any = {};
    if (query.status) where.appealStatus = query.status;
    const [items, total] = await Promise.all([
      this.prisma.moderationAppeal.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appellantUser: { select: { id: true, fullName: true, email: true } },
          reviewedBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.moderationAppeal.count({ where }),
    ]);
    const enriched = await this.enrichWithTargetData(items);
    return paginate(enriched, total, _page, _limit);
  }

  private async enrichWithTargetData(items: any[]) {
    const rfqIds = items.filter((a) => a.targetType === AppealTargetType.RFQ).map((a) => a.targetId as string);
    const listingIds = items.filter((a) => a.targetType === AppealTargetType.LISTING).map((a) => a.targetId as string);

    const [rfqs, listings] = await Promise.all([
      rfqIds.length > 0
        ? this.prisma.rFQ.findMany({ where: { id: { in: rfqIds } }, select: { id: true, title: true, moderationReason: true } })
        : [] as Array<{ id: string; title: string; moderationReason: string | null }>,
      listingIds.length > 0
        ? this.prisma.listing.findMany({ where: { id: { in: listingIds } }, select: { id: true, titleEn: true, titleAr: true, moderationReason: true } })
        : [] as Array<{ id: string; titleEn: string; titleAr: string; moderationReason: string | null }>,
    ]);

    const rfqMap: Record<string, { title: string; moderationReason: string | null }> = Object.fromEntries(
      rfqs.map((r) => [r.id, { title: r.title, moderationReason: r.moderationReason }]),
    );
    const listingMap: Record<string, { titleEn: string; moderationReason: string | null }> = Object.fromEntries(
      listings.map((l) => [l.id, { titleEn: l.titleEn, moderationReason: l.moderationReason }]),
    );

    return items.map((a) => {
      if (a.targetType === AppealTargetType.RFQ) {
        const rfq = rfqMap[a.targetId];
        return { ...a, targetTitle: rfq?.title ?? null, targetModerationReason: rfq?.moderationReason ?? null };
      } else {
        const listing = listingMap[a.targetId];
        return { ...a, targetTitle: listing?.titleEn ?? null, targetModerationReason: listing?.moderationReason ?? null };
      }
    });
  }

  async adminRespond(id: string, dto: AdminRespondAppealDto, adminUserId: string) {
    const appeal = await this.prisma.moderationAppeal.findUnique({ where: { id } });
    if (!appeal) throw new NotFoundException('Appeal not found');

    const updated = await this.prisma.moderationAppeal.update({
      where: { id },
      data: {
        adminResponse: dto.adminResponse,
        appealStatus: AppealStatus.UNDER_REVIEW,
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.log({
      action: 'APPEAL_RESPONDED',
      entity: 'ModerationAppeal',
      entityId: id,
      userId: adminUserId,
      after: { newStatus: AppealStatus.UNDER_REVIEW },
    });

    return updated;
  }

  async adminAccept(id: string, dto: AdminRespondAppealDto, adminUserId: string) {
    const appeal = await this.prisma.moderationAppeal.findUnique({ where: { id } });
    if (!appeal) throw new NotFoundException('Appeal not found');

    // Restore content to ACTIVE
    if (appeal.targetType === AppealTargetType.RFQ) {
      await this.prisma.rFQ.update({
        where: { id: appeal.targetId },
        data: { moderationStatus: ModerationStatus.ACTIVE, moderationReason: null, moderatedById: adminUserId, moderatedAt: new Date() },
      });
    } else {
      await this.prisma.listing.update({
        where: { id: appeal.targetId },
        data: { moderationStatus: ModerationStatus.ACTIVE, moderationReason: null, moderatedById: adminUserId, moderatedAt: new Date() },
      });
    }

    const updated = await this.prisma.moderationAppeal.update({
      where: { id },
      data: {
        appealStatus: AppealStatus.ACCEPTED,
        adminResponse: dto.adminResponse ?? appeal.adminResponse,
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.log({
      action: 'APPEAL_ACCEPTED',
      entity: 'ModerationAppeal',
      entityId: id,
      userId: adminUserId,
      after: { targetType: appeal.targetType, targetId: appeal.targetId },
    });

    return updated;
  }

  async adminReject(id: string, dto: AdminRespondAppealDto, adminUserId: string) {
    const appeal = await this.prisma.moderationAppeal.findUnique({ where: { id } });
    if (!appeal) throw new NotFoundException('Appeal not found');

    const updated = await this.prisma.moderationAppeal.update({
      where: { id },
      data: {
        appealStatus: AppealStatus.REJECTED,
        adminResponse: dto.adminResponse ?? appeal.adminResponse,
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.log({
      action: 'APPEAL_REJECTED',
      entity: 'ModerationAppeal',
      entityId: id,
      userId: adminUserId,
      after: { targetType: appeal.targetType, targetId: appeal.targetId },
    });

    return updated;
  }
}
