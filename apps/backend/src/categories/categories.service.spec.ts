import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('returns category when found', async () => {
      const cat = { id: '1', nameEn: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics' };
      mockPrisma.category.findUnique.mockResolvedValue(cat);
      const result = await service.findOne('1');
      expect(result).toEqual(cat);
    });
  });

  describe('create', () => {
    it('throws ConflictException if slug already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'existing', slug: 'test' });
      await expect(
        service.create({ nameAr: 'تجربة', nameEn: 'Test', slug: 'test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates category when slug is unique', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      const created = { id: 'new', nameAr: 'تجربة', nameEn: 'Test', slug: 'test' };
      mockPrisma.category.create.mockResolvedValue(created);
      const result = await service.create({ nameAr: 'تجربة', nameEn: 'Test', slug: 'test' });
      expect(result).toEqual(created);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
