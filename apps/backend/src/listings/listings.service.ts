import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ListingStatus, ModerationStatus, ModerationSource, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { SELLER_ROLES } from '../common/constants/platform.constants';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'listing-images');
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly moderation: ModerationService,
  ) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async findAll(query: PaginationDto & {
    categoryId?: string; supplierId?: string; search?: string;
    minPrice?: number; maxPrice?: number; sort?: string; adminView?: boolean;
  }) {
    const where: any = {
      status: ListingStatus.ACTIVE,
      supplier: { verificationStatus: 'VERIFIED' },
    };
    // Public view: only show ACTIVE moderation status
    if (!query.adminView && !query.supplierId) {
      where.moderationStatus = ModerationStatus.ACTIVE;
    }
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

  async findOne(id: string, callerUserId?: string) {
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

    // Guard: non-ACTIVE moderation → only owner or admin may see it
    if (listing.moderationStatus !== ModerationStatus.ACTIVE) {
      let allowed = false;
      if (callerUserId) {
        const caller = await this.prisma.user.findUnique({
          where: { id: callerUserId },
          select: { role: true, companyId: true },
        });
        allowed = caller?.role === Role.PLATFORM_ADMIN || caller?.companyId === listing.supplierId;
      }
      if (!allowed) throw new NotFoundException('Listing not found');
    }

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
        moderationStatus: ModerationStatus.ACTIVE,
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
    if (!SELLER_ROLES.includes(user.role)) throw new ForbiddenException('Only suppliers can create listings');
    if (user.company.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('Your company must be verified to create listings');
    }

    // Content moderation
    const modResult = this.moderation.moderate({ titleEn: dto.titleEn, titleAr: dto.titleAr, description: dto.descriptionEn });
    if (modResult.decision === 'BLOCK') {
      await this.audit.log({
        action: 'LISTING_BLOCKED_BY_SYSTEM',
        entity: 'Listing',
        userId,
        after: { reasonCode: modResult.reasonCode, matchedTerms: modResult.matchedTerms, companyId: user.companyId },
      });
      throw new BadRequestException('Content violates platform guidelines');
    }

    const moderationStatus = modResult.decision === 'FLAG'
      ? ModerationStatus.FLAGGED
      : ModerationStatus.ACTIVE;

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
        moderationStatus,
        moderationSource: moderationStatus === ModerationStatus.FLAGGED ? ModerationSource.SYSTEM : undefined,
        moderationReason: moderationStatus === ModerationStatus.FLAGGED ? modResult.reasonCode : undefined,
      },
      include: { category: true, images: true },
    });

    // Generate slug from English title
    const slug = generateSlug(dto.titleEn, listing.id);
    await this.prisma.listing.update({ where: { id: listing.id }, data: { slug } }).catch(() => {});

    const auditAction = moderationStatus === ModerationStatus.FLAGGED ? 'LISTING_FLAGGED_BY_SYSTEM' : 'LISTING_CREATED';
    await this.audit.log({
      action: auditAction,
      entity: 'Listing',
      entityId: listing.id,
      userId,
      after: {
        actorRole: user.role,
        supplierId: user.companyId,
        titleEn: dto.titleEn,
        categoryId: dto.categoryId,
        ...(moderationStatus === ModerationStatus.FLAGGED && { reasonCode: modResult.reasonCode }),
      },
    });

    return { ...listing, slug };
  }

  async update(id: string, dto: UpdateListingDto, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== Role.PLATFORM_ADMIN && user?.companyId !== listing.supplierId) {
      throw new ForbiddenException("Cannot modify another supplier's listing");
    }

    const updateData: any = {
      ...dto,
      tags: dto.tags ?? listing.tags,
      certifications: dto.certifications ?? listing.certifications,
    };

    // Re-run moderation if text content is changing
    if (dto.titleEn !== undefined || dto.titleAr !== undefined || dto.descriptionEn !== undefined) {
      const modResult = this.moderation.moderate({
        titleEn: dto.titleEn ?? listing.titleEn,
        titleAr: dto.titleAr ?? (listing.titleAr ?? undefined),
        description: dto.descriptionEn ?? (listing.descriptionEn ?? undefined),
      });
      if (modResult.decision === 'BLOCK') {
        await this.audit.log({
          action: 'LISTING_BLOCKED_BY_SYSTEM',
          entity: 'Listing',
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
          action: 'LISTING_FLAGGED_BY_SYSTEM',
          entity: 'Listing',
          entityId: id,
          userId,
          after: { reasonCode: modResult.reasonCode, event: 'UPDATE' },
        });
      }
    }

    return this.prisma.listing.update({
      where: { id },
      data: updateData,
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

  // ─── Bulk Import ─────────────────────────────────────────────────────────────

  getBulkImportTemplate(): Buffer {
    const headers = [
      'external_id', 'product_name_en', 'product_name_ar',
      'description_en', 'description_ar',
      'category_slug', 'brand', 'model_number',
      'price_sar', 'currency', 'minimum_order_qty', 'unit',
      'stock_qty', 'lead_time_days', 'country_of_origin',
      'warranty_months', 'image_url', 'rfq_only', 'status', 'tags',
    ];

    const sample = [
      'PROD-001', 'Industrial Safety Helmet', 'خوذة السلامة الصناعية',
      'High-grade ABS safety helmet for industrial use', 'خوذة سلامة عالية الجودة',
      'safety-security', 'SafeGuard', 'SG-H100',
      '45.00', 'SAR', '50', 'piece',
      '500', '7', 'Saudi Arabia',
      '12', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
      'NO', 'ACTIVE', 'safety,helmet,industrial',
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);

    // Column widths
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    // ── Instructions sheet ──────────────────────────────────────────────────
    const instructions = [
      ['Mwazn Bulk Product Import — Instructions'],
      [],
      ['REQUIRED COLUMNS',    'DESCRIPTION',                           'ALLOWED VALUES / NOTES'],
      ['external_id',         'Your unique product reference',         'Any string; must be unique within this file'],
      ['product_name_en',     'Product name in English',               'Required'],
      ['description_en',      'Description in English',                'Required'],
      ['category_slug',       'Category identifier',                   'building-materials | safety-security | technology-electronics | food-beverages | industrial-equipment | ...'],
      ['unit',                'Selling unit',                          'piece | box | kg | liter | set | meter | ton'],
      ['image_url',           'Product image URL',                     'Must start with http:// or https://'],
      ['rfq_only',            'Quote-only? (no public price)',         'YES or NO'],
      ['status',              'Listing status',                        'ACTIVE | INACTIVE'],
      [],
      ['OPTIONAL COLUMNS',    '',                                      ''],
      ['product_name_ar',     'Product name in Arabic',                'Optional'],
      ['description_ar',      'Description in Arabic',                 'Optional'],
      ['brand',               'Brand name',                            'Optional'],
      ['model_number',        'Model / SKU',                           'Optional'],
      ['price_sar',           'Price in SAR',                          'Required if rfq_only=NO; leave blank if rfq_only=YES'],
      ['currency',            'Currency',                              'SAR only'],
      ['minimum_order_qty',   'Minimum order quantity',                'Positive integer'],
      ['stock_qty',           'Available stock',                       'Positive integer'],
      ['lead_time_days',      'Lead time in days',                     'Positive integer'],
      ['country_of_origin',   'Country of manufacture',               'e.g. Saudi Arabia'],
      ['warranty_months',     'Warranty in months',                    'Positive integer'],
      ['tags',                'Comma-separated search tags',           'e.g. safety,industrial,PPE'],
    ];
    const wsI = XLSX.utils.aoa_to_sheet(instructions);
    wsI['!cols'] = [{ wch: 26 }, { wch: 36 }, { wch: 58 }];
    XLSX.utils.book_append_sheet(wb, wsI, 'Instructions');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async bulkImport(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ total: number; imported: number; failed: number; errors: Array<{ row: number; field: string; message: string }> }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    if (!user) throw new ForbiddenException();
    if (!SELLER_ROLES.includes(user.role) || user.company.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException('Only verified suppliers and freelancers can import products');
    }

    // Load all categories into a slug → id map
    const allCats = await this.prisma.category.findMany({ select: { id: true, slug: true } });
    const catMap = new Map<string, string>(allCats.map((c) => [c.slug, c.id]));

    // Parse xlsx
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rows.length < 2) {
      return { total: 0, imported: 0, failed: 0, errors: [] };
    }

    const headers: string[] = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());
    const col = (name: string) => headers.indexOf(name);

    const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== undefined && c !== ''));
    const total = dataRows.length;
    const errors: Array<{ row: number; field: string; message: string }> = [];
    let imported = 0;
    const seenExternalIds = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = i + 2; // 1-indexed, row 1 = headers
      const row = dataRows[i];
      const get = (name: string) => String(row[col(name)] ?? '').trim();
      const rowErrors: Array<{ field: string; message: string }> = [];

      const externalId = get('external_id');
      if (!externalId) {
        rowErrors.push({ field: 'external_id', message: 'Required' });
      } else if (seenExternalIds.has(externalId)) {
        rowErrors.push({ field: 'external_id', message: 'Duplicate within file' });
      } else {
        seenExternalIds.add(externalId);
      }

      const productNameEn = get('product_name_en');
      if (!productNameEn) rowErrors.push({ field: 'product_name_en', message: 'Required' });

      const descriptionEn = get('description_en');
      if (!descriptionEn) rowErrors.push({ field: 'description_en', message: 'Required' });

      const categorySlug = get('category_slug');
      if (!categorySlug) {
        rowErrors.push({ field: 'category_slug', message: 'Required' });
      } else if (!catMap.has(categorySlug)) {
        rowErrors.push({ field: 'category_slug', message: `Category "${categorySlug}" not found` });
      }

      const unit = get('unit');
      if (!unit) rowErrors.push({ field: 'unit', message: 'Required' });

      const imageUrl = get('image_url');
      if (!imageUrl) {
        rowErrors.push({ field: 'image_url', message: 'Required' });
      } else if (!isValidHttpUrl(imageUrl)) {
        rowErrors.push({ field: 'image_url', message: 'Must be a valid http:// or https:// URL' });
      }

      const rfqOnlyRaw = get('rfq_only').toUpperCase();
      if (!rfqOnlyRaw || !['YES', 'NO'].includes(rfqOnlyRaw)) {
        rowErrors.push({ field: 'rfq_only', message: 'Must be YES or NO' });
      }

      const statusRaw = get('status').toUpperCase();
      if (!statusRaw || !['ACTIVE', 'DRAFT', 'INACTIVE'].includes(statusRaw)) {
        rowErrors.push({ field: 'status', message: 'Must be ACTIVE, DRAFT, or INACTIVE' });
      }

      const priceRaw = get('price_sar');
      const rfqOnly = rfqOnlyRaw === 'YES';
      let price: number | null = null;
      if (!rfqOnly) {
        if (!priceRaw) {
          rowErrors.push({ field: 'price_sar', message: 'Required when rfq_only=NO' });
        } else {
          price = parseFloat(priceRaw);
          if (isNaN(price) || price <= 0) {
            rowErrors.push({ field: 'price_sar', message: 'Must be a positive number' });
          }
        }
      } else if (priceRaw) {
        price = parseFloat(priceRaw);
        if (isNaN(price) || price < 0) price = null;
      }

      const currency = get('currency') || 'SAR';
      if (currency !== 'SAR') {
        rowErrors.push({ field: 'currency', message: 'Only SAR is accepted' });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors.map((e) => ({ row: rowNum, ...e })));
        continue;
      }

      // Import row
      try {
        const categoryId = catMap.get(categorySlug)!;
        const listingStatus = statusRaw === 'ACTIVE' ? ListingStatus.ACTIVE : ListingStatus.INACTIVE;
        const tagsRaw = get('tags');
        const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
        const minOrderQty = parseInt(get('minimum_order_qty')) || undefined;
        const leadTimeDays = parseInt(get('lead_time_days')) || undefined;
        const sku = get('model_number') || undefined;
        const titleAr = get('product_name_ar') || productNameEn;

        // Content moderation per row
        const modResult = this.moderation.moderate({ titleEn: productNameEn, titleAr, description: descriptionEn });
        if (modResult.decision === 'BLOCK') {
          errors.push({ row: rowNum, field: 'content', message: `Content violates platform guidelines (${modResult.reasonCode})` });
          await this.audit.log({
            action: 'LISTING_BLOCKED_BY_SYSTEM',
            entity: 'Listing',
            userId,
            after: { reasonCode: modResult.reasonCode, row: rowNum, event: 'BULK_IMPORT' },
          });
          continue;
        }
        const bulkModerationStatus = modResult.decision === 'FLAG' ? ModerationStatus.FLAGGED : ModerationStatus.ACTIVE;

        const listing = await this.prisma.listing.create({
          data: {
            titleEn: productNameEn,
            titleAr,
            descriptionEn,
            descriptionAr: get('description_ar') || undefined,
            price: price ?? undefined,
            currency: 'SAR',
            unit,
            minOrderQty,
            leadTimeDays,
            tags,
            sku,
            requestQuoteOnly: rfqOnly,
            status: listingStatus,
            supplierId: user.companyId,
            categoryId,
            moderationStatus: bulkModerationStatus,
            moderationSource: bulkModerationStatus === ModerationStatus.FLAGGED ? ModerationSource.SYSTEM : undefined,
            moderationReason: bulkModerationStatus === ModerationStatus.FLAGGED ? modResult.reasonCode : undefined,
          },
        });

        // Generate slug
        const slug = generateSlug(productNameEn, listing.id);
        await this.prisma.listing.update({ where: { id: listing.id }, data: { slug } }).catch(() => {});

        // Add image
        await this.prisma.listingImage.create({
          data: { listingId: listing.id, url: imageUrl, isPrimary: true, sortOrder: 0, filename: '' },
        });

        imported++;
      } catch (err: any) {
        errors.push({ row: rowNum, field: 'general', message: err?.message ?? 'Failed to save row' });
      }
    }

    const result = { total, imported, failed: total - imported, errors };

    await this.audit.log({
      action: 'BULK_IMPORT',
      entity: 'Listing',
      userId,
      after: { actorRole: user.role, supplierId: user.companyId, total, imported, failed: result.failed },
    });

    return result;
  }
}
