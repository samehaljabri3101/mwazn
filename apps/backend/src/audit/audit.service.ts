import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

export interface AuditPayload {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  before?: object;
  after?: object;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(payload: AuditPayload) {
    return this.prisma.auditLog.create({ data: payload });
  }

  async findAll(query: PaginationDto & { entity?: string; userId?: string }) {
    const where: any = {};
    if (query.entity) where.entity = query.entity;
    if (query.userId) where.userId = query.userId;

    const _page = Number(query.page) || 1;
    const _limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (_page - 1) * _limit,
        take: _limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(items, total, _page, _limit);
  }
}
