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
import * as path from 'path';
import * as fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'listing-images');
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${base}-${id.slice(-6)}`;
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async findAll(query: PaginationDto & {
    categoryId?: string; supplierId?: string; search?: string;
    minPrice?: number; maxPrice?: number; sort?: string;
  }) {
    const where: any = {
      status: ListingStatus.ACTIVE,
      supplier: { verificationStatus: 'VERIFIED' },
    };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.search) {
      where.OR = [
        { titleAr: { contains: query.search } },
        { titleEn: { contains: query.search, mode: 'insensitive' } },
        { descriptionEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = query.minPrice;
      if (query.maxPrice) where.price.lte = query.maxPrice;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    if (query.sort === 'popular') orderBy = { viewCount: 'desc' };

    const limitNum = query.limit ? Number(query.limit) : 20;
    const skipNum = query.skip !== undefined ? Number(query.skip) : (((Number(query.page) || 1) - 1) * limitNum);
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: skipNum,
        take: limitNum,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: true,
          supplier: {
            select: {
              id: true, nameAr: true, nameEn: true, logoUrl: true,
              city: true, verificationStatus: true, plan: true, slug: true,
            },
          },
          _count: { select: { quotes: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(items, total, Number(query.page) || 1, limitNum);
  }

  async findOne(id: string) {
    // Try by ID or slug
    const listing = await this.prisma.listing.findFirst({
      where: { OR: [{ id }, { slug: id }], status: { not: ListingStatus.ARCHIVED } },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { include: { children: true } },
        supplier: {
          select: {
            id: true, nameAr: true, nameEn: true, logoUrl: true, city: true,
            verificationStatus: true, plan: true, slug: true, phone: true,
            website: true, descriptionEn: true, descriptionAr: true,
            _count: { select: { ratingsReceived: true, listings: true } },
          },
        },
        _count: { select: { quotes: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    // Increment view count
    await this.prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    return listing;
  }

  async getSimilar(listingId: string, limit = 6) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return [];

    return this.prisma.listing.findMany({
      where: {
        categoryId: listing.categoryId,
        status: ListingStatus.ACTIVE,
        id: { not: listingId },
      },
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        supplier: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
      },
      orderBy: { viewCount: 'desc' },
    });
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

    const listing = await this.prisma.listing.create({
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        price: dto.price,
        priceTo: dto.priceTo,
        currency: dto.currency || 'SAR',
        unit: dto.unit,
        minOrderQty: dto.minOrderQty,
        leadTimeDays: dto.leadTimeDays,
        tags: dto.tags ?? [],
        certifications: dto.certifications ?? [],
        supplierId: user.companyId,
        categoryId: dto.categoryId,
      },
      include: { category: true, images: true },
    });

    // Generate slug from English title
    const slug = generateSlug(dto.titleEn, listing.id);
    await this.prisma.listing.update({ where: { id: listing.id }, data: { slug } }).catch(() => {});

    return { ...listing, slug };
  }

  async update(id: string, dto: UpdateListingDto, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== listing.supplierId) {
      throw new ForbiddenException("Cannot modify another supplier's listing");
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...dto,
        tags: dto.tags ?? listing.tags,
        certifications: dto.certifications ?? listing.certifications,
      },
      include: { category: true, images: true },
    });
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

  // ─── Image management ────────────────────────────────────────────────────────

  async uploadImages(listingId: string, files: Express.Multer.File[], userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== listing.supplierId && user?.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException();
    }

    const results: any[] = [];
    const currentCount = await this.prisma.listingImage.count({ where: { listingId } });

    for (const file of files) {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid type: ${file.mimetype}`);
      }
      if (file.size > MAX_SIZE) {
        throw new BadRequestException(`File too large: ${file.originalname}`);
      }

      const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
      const filename = `${listingId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, file.buffer);

      const url = `/uploads/listing-images/${filename}`;
      const sortOrder = currentCount + results.length;
      const isPrimary = sortOrder === 0;

      const img = await this.prisma.listingImage.create({
        data: { listingId, url, filename, isPrimary, sortOrder, alt: listing.titleEn },
      });
      results.push(img);
    }

    return results;
  }

  async deleteImage(listingId: string, imageId: string, userId: string) {
    const image = await this.prisma.listingImage.findFirst({ where: { id: imageId, listingId } });
    if (!image) throw new NotFoundException();

    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== listing?.supplierId && user?.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException();
    }

    if (image.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), image.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await this.prisma.listingImage.delete({ where: { id: imageId } });
    return { deleted: true };
  }

  async addImage(listingId: string, userId: string, url: string, isPrimary = false) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== listing.supplierId) throw new ForbiddenException();

    if (isPrimary) {
      await this.prisma.listingImage.updateMany({ where: { listingId }, data: { isPrimary: false } });
    }
    const count = await this.prisma.listingImage.count({ where: { listingId } });
    return this.prisma.listingImage.create({
      data: { listingId, url, isPrimary, sortOrder: count, filename: '', alt: listing.titleEn },
    });
  }
}
