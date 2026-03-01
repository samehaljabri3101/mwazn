import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Supplier uploads a verification document */
  async uploadDocument(companyId: string, type: string, fileUrl: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.type !== 'SUPPLIER') throw new ForbiddenException('Only suppliers can upload verification documents');

    const doc = await this.prisma.companyVerificationDocument.create({
      data: { companyId, type: type as any, fileUrl },
    });

    this.logger.log(`Supplier ${companyId} uploaded verification doc type=${type}`);
    return doc;
  }

  /** Supplier views their own verification documents */
  async getMyDocuments(companyId: string) {
    return this.prisma.companyVerificationDocument.findMany({
      where: { companyId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /** Admin: list all companies pending verification */
  async listPending() {
    return this.prisma.company.findMany({
      where: { type: 'SUPPLIER', verificationStatus: 'PENDING', isActive: true },
      include: {
        verificationDocs: { orderBy: { uploadedAt: 'desc' } },
        _count: { select: { listings: true, quotesSubmitted: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Admin: list all suppliers (any status) with docs */
  async listAll(status?: string) {
    return this.prisma.company.findMany({
      where: {
        type: 'SUPPLIER',
        ...(status ? { verificationStatus: status as any } : {}),
      },
      include: {
        verificationDocs: { orderBy: { uploadedAt: 'desc' } },
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /** Admin: approve a supplier */
  async approve(companyId: string, adminUserId: string, notes?: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    await this.prisma.$transaction([
      this.prisma.company.update({
        where: { id: companyId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: adminUserId,
          verificationNotes: notes,
        },
      }),
      this.prisma.companyVerificationDocument.updateMany({
        where: { companyId, decision: null },
        data: { decision: 'APPROVED', reviewedAt: new Date(), reviewerId: adminUserId },
      }),
    ]);

    await this.audit.log({
      userId: adminUserId,
      action: 'VERIFY_APPROVE',
      entity: 'Company',
      entityId: companyId,
      after: { verificationStatus: 'VERIFIED', notes },
    });

    this.logger.log(`Company ${companyId} APPROVED by admin ${adminUserId}`);
  }

  /** Admin: reject a supplier */
  async reject(companyId: string, adminUserId: string, notes: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    await this.prisma.$transaction([
      this.prisma.company.update({
        where: { id: companyId },
        data: {
          verificationStatus: 'REJECTED',
          verifiedBy: adminUserId,
          verificationNotes: notes,
        },
      }),
      this.prisma.companyVerificationDocument.updateMany({
        where: { companyId, decision: null },
        data: { decision: 'REJECTED', reviewedAt: new Date(), reviewerId: adminUserId, notes },
      }),
    ]);

    await this.audit.log({
      userId: adminUserId,
      action: 'VERIFY_REJECT',
      entity: 'Company',
      entityId: companyId,
      after: { verificationStatus: 'REJECTED', notes },
    });

    this.logger.log(`Company ${companyId} REJECTED by admin ${adminUserId}`);
  }
}
