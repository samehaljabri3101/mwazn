import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, rfqId: { type: 'string' }, quoteId: { type: 'string' }, messageId: { type: 'string' } } } })
  @ApiOperation({ summary: 'Upload a file (max 10 MB, whitelisted MIME types)' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { rfqId?: string; quoteId?: string; messageId?: string },
  ) {
    return this.uploadService.handleUpload(file, body);
  }
}
