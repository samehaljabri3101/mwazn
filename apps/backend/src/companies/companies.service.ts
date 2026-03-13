import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CompanyType, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScoringService } from '../scoring/scoring.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { VerifyCompanyDto } from './dto/verify-company.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scoringService: ScoringService,
  ) {}

  async findAll(query: PaginationDto & { type?: CompanyType; status?: VerificationStatus; search?: string }) {
    // Coerce to numbers — intersection types bypass class-transformer
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 20), 200);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.verificationStatus = query.status;
    if (query.search) {
      where.OR = [
        { nameEn: { contains: query.search, mode: 'insensitive' } },
        { nameAr: { contains: query.search } },
        { crNumber: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, listings: true, rfqs: true } },
          verificationDocs: { orderBy: { uploadedAt: 'desc' }, take: 10 },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        categories: true,
        _count: { select: { listings: true, rfqs: true, quotesSubmitted: true, dealsAsBuyer: true, dealsAsSupplier: true, ratingsReceived: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    const trustTier = this.scoringService.getTrustTier({
      verificationStatus: String(company.verificationStatus),
      plan: String(company.plan),
      supplierScore: company.supplierScore ? Number(company.supplierScore) : null,
    });
    return { ...company, trustTier };
  }

  async update(id: string, userId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== id) {
      throw new ForbiddenException('Cannot modify another company');
    }

    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async verify(id: string, dto: VerifyCompanyDto, adminUserId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only supplier companies require verification');
    }
    if (company.verificationStatus !== VerificationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot change verification status: company is already ${company.verificationStatus}. Only PENDING companies can be approved or rejected.`,
      );
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        verificationStatus: dto.status,
        ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
      },
    });

    await this.audit.log({
      action: dto.status === 'VERIFIED' ? 'COMPANY_VERIFIED' : 'COMPANY_REJECTED',
      entity: 'Company',
      entityId: id,
      userId: adminUserId,
      before: { verificationStatus: company.verificationStatus },
      after: { verificationStatus: dto.status, reason: dto.reason, adminNotes: dto.adminNotes },
    });

    return updated;
  }

  async getPendingSuppliers() {
    return this.prisma.company.findMany({
      where: { type: CompanyType.SUPPLIER, verificationStatus: VerificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getShowroom(idOrSlug: string) {
    // Support both UUID (id) and friendly slug (e.g. "demo-8")
    const company = await this.prisma.company.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        type: CompanyType.SUPPLIER,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          include: { images: true, category: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        ratingsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
    if (!company) throw new NotFoundException('Supplier not found or not verified');

    const { listings, ratingsReceived, ...companyData } = company;

    const totalRatings = ratingsReceived.length;
    const averageRating =
      totalRatings > 0
        ? Math.round(
            (ratingsReceived.reduce((sum, r) => sum + r.score, 0) / totalRatings) * 10,
          ) / 10
        : 0;

    const trustTier = this.scoringService.getTrustTier({
      verificationStatus: String(company.verificationStatus),
      plan: String(company.plan),
      supplierScore: company.supplierScore ? Number(company.supplierScore) : null,
    });

    return { company: { ...companyData, trustTier }, listings, averageRating, totalRatings };
  }
}
