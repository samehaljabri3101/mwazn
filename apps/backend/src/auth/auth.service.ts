import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CompanyType, Role, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MaroofService } from '../maroof/maroof.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterFreelancerDto } from './dto/register-freelancer.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly maroof: MaroofService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const existingCR = await this.prisma.company.findUnique({ where: { crNumber: dto.crNumber } });
    if (existingCR) throw new ConflictException('CR number already registered');

    if (dto.companyType === CompanyType.SUPPLIER) {
      const crCheck = await this.maroof.validateCR(dto.crNumber);
      if (!crCheck.valid) throw new BadRequestException('Invalid CR number format or not found in Maroof');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = dto.companyType === CompanyType.BUYER ? Role.BUYER_ADMIN : Role.SUPPLIER_ADMIN;

    const verificationStatus =
      dto.companyType === CompanyType.BUYER
        ? VerificationStatus.VERIFIED
        : VerificationStatus.PENDING;

    const company = await this.prisma.company.create({
      data: {
        nameAr: dto.companyNameAr,
        nameEn: dto.companyNameEn,
        crNumber: dto.crNumber,
        type: dto.companyType,
        city: dto.city,
        phone: dto.phone,
        verificationStatus,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            fullName: dto.fullName,
            role,
          },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const tokens = await this.generateTokens(user.id, user.email, user.role, company.id);

    this.logger.log(`New ${dto.companyType} registered: ${dto.email}`);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      company: this.sanitizeCompany(company),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });

    if (!user || !user.isActive)
      throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.companyId);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      company: this.sanitizeCompany(user.company),
    };
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const tokenRecords = await this.prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });

    let matchedRecord: (typeof tokenRecords)[0] | undefined;
    for (const record of tokenRecords) {
      const match = await bcrypt.compare(rawRefreshToken, record.tokenHash);
      if (match) { matchedRecord = record; break; }
    }

    if (!matchedRecord) throw new UnauthorizedException('Invalid or expired refresh token');

    await this.prisma.refreshToken.delete({ where: { id: matchedRecord.id } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('User inactive');

    return this.generateTokens(user.id, user.email, user.role, user.companyId);
  }

  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const records = await this.prisma.refreshToken.findMany({ where: { userId } });
      for (const record of records) {
        const match = await bcrypt.compare(rawRefreshToken, record.tokenHash);
        if (match) {
          await this.prisma.refreshToken.delete({ where: { id: record.id } });
          break;
        }
      }
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new UnauthorizedException();
    return { user: this.sanitizeUser(user), company: this.sanitizeCompany(user.company) };
  }

  async registerSupplier(dto: RegisterSupplierDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const existingCR = await this.prisma.company.findUnique({ where: { crNumber: dto.crNumber } });
    if (existingCR) throw new ConflictException('CR number already registered');

    const crCheck = await this.maroof.validateCR(dto.crNumber);
    if (!crCheck.valid) throw new BadRequestException('Invalid CR number format or not found in Maroof');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const company = await this.prisma.company.create({
      data: {
        nameAr: dto.companyNameAr,
        nameEn: dto.companyNameEn,
        crNumber: dto.crNumber,
        type: CompanyType.SUPPLIER,
        city: dto.city,
        phone: dto.phone,
        verificationStatus: VerificationStatus.PENDING,
        users: {
          create: { email: dto.email, passwordHash, fullName: dto.fullName, role: Role.SUPPLIER_ADMIN },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const tokens = await this.generateTokens(user.id, user.email, user.role, company.id);
    this.logger.log(`New SUPPLIER registered: ${dto.email}`);
    return { ...tokens, user: this.sanitizeUser(user), company: this.sanitizeCompany(company) };
  }

  async registerBuyer(dto: RegisterBuyerDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const existingCR = await this.prisma.company.findUnique({ where: { crNumber: dto.crNumber } });
    if (existingCR) throw new ConflictException('CR number already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const company = await this.prisma.company.create({
      data: {
        nameAr: dto.companyNameAr,
        nameEn: dto.companyNameEn,
        crNumber: dto.crNumber,
        type: CompanyType.BUYER,
        city: dto.city,
        phone: dto.phone,
        verificationStatus: VerificationStatus.VERIFIED,
        users: {
          create: { email: dto.email, passwordHash, fullName: dto.fullName, role: Role.BUYER_ADMIN },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const tokens = await this.generateTokens(user.id, user.email, user.role, company.id);
    this.logger.log(`New BUYER registered: ${dto.email}`);
    return { ...tokens, user: this.sanitizeUser(user), company: this.sanitizeCompany(company) };
  }

  async registerFreelancer(dto: RegisterFreelancerDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const existingNID = await this.prisma.company.findUnique({ where: { crNumber: dto.nationalId } });
    if (existingNID) throw new ConflictException('National ID / Iqama already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const company = await this.prisma.company.create({
      data: {
        nameAr: dto.fullName,
        nameEn: dto.fullName,
        crNumber: dto.nationalId,
        type: CompanyType.SUPPLIER,
        city: dto.city,
        phone: dto.phone,
        descriptionEn: dto.bio,
        verificationStatus: VerificationStatus.PENDING,
        users: {
          create: { email: dto.email, passwordHash, fullName: dto.fullName, role: Role.FREELANCER },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const tokens = await this.generateTokens(user.id, user.email, user.role, company.id);
    this.logger.log(`New FREELANCER registered: ${dto.email}`);
    return { ...tokens, user: this.sanitizeUser(user), company: this.sanitizeCompany(company) };
  }

  async updateProfile(userId: string, dto: { fullName?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
      include: { company: true },
    });
    return { user: this.sanitizeUser(updated), company: this.sanitizeCompany(updated.company) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return { message: 'Password changed successfully' };
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string, companyId: string) {
    const payload = { sub: userId, email, role, companyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES') || '15m',
      }),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES') || '7d',
        },
      ),
    ]);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }

  private sanitizeCompany(company: any) {
    const { users: _u, ...safe } = company ?? {};
    return safe;
  }
}
