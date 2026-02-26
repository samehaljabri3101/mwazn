import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ListingStatus, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto & { categoryId?: string; supplierId?: string; search?: string }) {
    const where: any = { status: ListingStatus.ACTIVE };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.search) {
      where.OR = [
        { titleAr: { contains: query.search, mode: 'insensitive' } },
        { titleEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: true,
          supplier: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true, city: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        supplier: {
          select: {
            id: true, nameAr: true, nameEn: true, logoUrl: true,
            city: true, verificationStatus: true, plan: true,
            _count: { select: { ratingsReceived: true } },
          },
        },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async create(dto: CreateListingDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new ForbiddenException();
    if (user.company.type !== 'SUPPLIER') throw new ForbiddenException('Only suppliers can create listings');
    if (user.company.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('Your company must be verified to create listings');
    }

    return this.prisma.listing.create({
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        price: dto.price,
        currency: dto.currency || 'SAR',
        unit: dto.unit,
        minOrderQty: dto.minOrderQty,
        supplierId: user.companyId,
        categoryId: dto.categoryId,
      },
      include: { category: true, images: true },
    });
  }

  async update(id: string, dto: UpdateListingDto, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== listing.supplierId) {
      throw new ForbiddenException('Cannot modify another supplier\'s listing');
    }

    return this.prisma.listing.update({ where: { id }, data: dto, include: { category: true, images: true } });
  }

  async remove(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== listing.supplierId) {
      throw new ForbiddenException();
    }

    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.ARCHIVED },
    });
  }

  async addImage(listingId: string, userId: string, url: string, isPrimary = false) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== listing.supplierId) throw new ForbiddenException();

    if (isPrimary) {
      await this.prisma.listingImage.updateMany({ where: { listingId }, data: { isPrimary: false } });
    }
    return this.prisma.listingImage.create({ data: { listingId, url, isPrimary } });
  }
}
