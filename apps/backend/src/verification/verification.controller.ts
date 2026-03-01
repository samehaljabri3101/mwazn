import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { VerificationService } from './verification.service';

@ApiTags('Verification')
@Controller('verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a verification document (supplier only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/verification',
        filename: (_req, file, cb) =>
          cb(null, `${uuid()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async uploadDocument(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(pdf|jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    const fileUrl = `/uploads/verification/${file.filename}`;
    return this.verification.uploadDocument(req.user.companyId, type, fileUrl);
  }

  @Get('my-documents')
  @ApiOperation({ summary: 'Get my verification documents' })
  getMyDocuments(@Request() req: any) {
    return this.verification.getMyDocuments(req.user.companyId);
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: '[Admin] List suppliers pending verification' })
  listPending() {
    return this.verification.listPending();
  }

  @Get('admin/suppliers')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: '[Admin] List all suppliers with documents' })
  listAll(@Query('status') status?: string) {
    return this.verification.listAll(status);
  }

  @Patch('admin/:companyId/approve')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: '[Admin] Approve supplier verification' })
  approve(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Body('notes') notes?: string,
  ) {
    return this.verification.approve(companyId, req.user.id, notes);
  }

  @Patch('admin/:companyId/reject')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: '[Admin] Reject supplier verification' })
  reject(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Body('notes') notes: string,
  ) {
    return this.verification.reject(companyId, req.user.id, notes);
  }
}
