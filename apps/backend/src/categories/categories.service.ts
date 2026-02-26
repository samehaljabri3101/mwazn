import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { children: { where: { isActive: true } }, _count: { select: { listings: true, rfqs: true } } },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
  }

  async findRoots() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { listings: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true, _count: { select: { listings: true, rfqs: true } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already in use');
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug already in use');
    }
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
