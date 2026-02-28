import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CompanyType, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { VerifyCompanyDto } from './dto/verify-company.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto & { type?: CompanyType; status?: VerificationStatus }) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.verificationStatus = query.status;

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, listings: true, rfqs: true } } },
      }),
      this.prisma.company.count({ where }),
    ]);

    return paginate(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        categories: true,
        _count: { select: { listings: true, rfqs: true, quotesSubmitted: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
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

  async verify(id: string, dto: VerifyCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only supplier companies require verification');
    }

    return this.prisma.company.update({
      where: { id },
      data: { verificationStatus: dto.status },
    });
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

    return { company: companyData, listings, averageRating, totalRatings };
  }
}
