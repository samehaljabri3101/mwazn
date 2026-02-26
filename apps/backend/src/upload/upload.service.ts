import {
  Injectable,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async handleUpload(
    file: Express.Multer.File,
    context: { rfqId?: string; quoteId?: string; messageId?: string },
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE)
      throw new PayloadTooLargeException('File exceeds 10 MB limit');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype))
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);

    const filename = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const dest = path.join(this.uploadDir, filename);
    fs.writeFileSync(dest, file.buffer);

    const url = `/uploads/${filename}`;

    return this.prisma.fileUpload.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        rfqId: context.rfqId,
        quoteId: context.quoteId,
        messageId: context.messageId,
      },
    });
  }
}
