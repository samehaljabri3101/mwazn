import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(includeInactive = false) {
    const cacheKey = `categories:all:${includeInactive}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { children: { where: { isActive: true } }, _count: { select: { listings: true, rfqs: true } } },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
    await this.cache.set(cacheKey, result, 300_000); // 5 min
    return result;
  }

  async findRoots() {
    const cacheKey = 'categories:roots';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { listings: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
    await this.cache.set(cacheKey, result, 300_000); // 5 min
    return result;
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true, _count: { select: { listings: true, rfqs: true } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  private async invalidateCategoryCache() {
    await Promise.all([
      this.cache.del('categories:roots'),
      this.cache.del('categories:all:false'),
      this.cache.del('categories:all:true'),
    ]);
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already in use');
    const result = await this.prisma.category.create({ data: dto });
    await this.invalidateCategoryCache();
    return result;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug already in use');
    }
    const result = await this.prisma.category.update({ where: { id }, data: dto });
    await this.invalidateCategoryCache();
    return result;
  }

  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const result = await this.prisma.category.update({ where: { id }, data: { isActive: false } });
    await this.invalidateCategoryCache();
    return result;
  }
}
