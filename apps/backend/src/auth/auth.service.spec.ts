import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  company: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  refreshToken: { create: jest.fn(), findMany: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
};

const mockJwt = { signAsync: jest.fn().mockResolvedValue('mock-token') };
const mockConfig = { get: jest.fn((key: string) => {
  const map: Record<string, string> = {
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRES: '15m',
    JWT_REFRESH_EXPIRES: '7d',
  };
  return map[key];
}) };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password1!',
          fullName: 'Test User',
          companyNameAr: 'شركة',
          companyNameEn: 'Company',
          crNumber: '1234567890',
          companyType: 'BUYER' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if CR already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.company.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({
          email: 'new@example.com',
          password: 'Password1!',
          fullName: 'Test User',
          companyNameAr: 'شركة',
          companyNameEn: 'Company',
          crNumber: '1234567890',
          companyType: 'BUYER' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@example.com', password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correctPassword', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        isActive: true,
        passwordHash: hash,
        companyId: 'c1',
        email: 'user@example.com',
        role: 'BUYER_ADMIN',
        company: { id: 'c1', nameEn: 'Co' },
      });
      await expect(
        service.login({ email: 'user@example.com', password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
