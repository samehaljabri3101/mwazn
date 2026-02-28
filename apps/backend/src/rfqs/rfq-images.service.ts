import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as path from 'path';
import * as fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'rfq-images');
const MAX_IMAGES = 8;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class RfqImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async uploadImages(rfqId: string, files: Express.Multer.File[], userId: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== rfq.buyerId && user?.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only the RFQ owner can upload images');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Count existing images
    const existing = await this.prisma.rfqImage.count({ where: { rfqId } });
    if (existing + files.length > MAX_IMAGES) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES} images allowed per RFQ`);
    }

    const results: any[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP allowed.`);
      }
      if (file.size > MAX_SIZE) {
        throw new BadRequestException(`File too large: ${file.originalname}. Max 5 MB.`);
      }

      // Save file to disk
      const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
      const filename = `${rfqId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, file.buffer);

      const url = `/uploads/rfq-images/${filename}`;
      const nextOrder = (await this.prisma.rfqImage.count({ where: { rfqId } }));

      const image = await this.prisma.rfqImage.create({
        data: {
          rfqId,
          url,
          filename,
          mimeType: file.mimetype,
          size: file.size,
          sortOrder: nextOrder,
          uploadedBy: userId,
        },
      });
      results.push(image);
    }

    await this.audit.log({
      action: 'RFQ_IMAGES_UPLOADED',
      entity: 'RfqImage',
      entityId: rfqId,
      userId,
      after: { count: results.length },
    });

    return results;
  }

  async getImages(rfqId: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return this.prisma.rfqImage.findMany({
      where: { rfqId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async deleteImage(rfqId: string, imageId: string, userId: string) {
    const image = await this.prisma.rfqImage.findFirst({ where: { id: imageId, rfqId } });
    if (!image) throw new NotFoundException('Image not found');

    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== rfq?.buyerId && user?.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only the RFQ owner can delete images');
    }

    // Remove file from disk
    const filePath = path.join(UPLOAD_DIR, image.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await this.prisma.rfqImage.delete({ where: { id: imageId } });

    await this.audit.log({
      action: 'RFQ_IMAGE_DELETED',
      entity: 'RfqImage',
      entityId: imageId,
      userId,
    });

    return { deleted: true };
  }
}
