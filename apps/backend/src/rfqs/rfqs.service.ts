import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { RFQStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRFQDto, UpdateRFQDto } from './dto/rfq.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class RFQsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto & { categoryId?: string; status?: RFQStatus; buyerId?: string }) {
    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.buyerId) where.buyerId = query.buyerId;

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
}
