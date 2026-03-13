import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiProperty, ApiResponse } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { memoryStorage } from 'multer';
import { RFQStatus } from '@prisma/client';
import { RFQsService } from './rfqs.service';
import { RfqImagesService } from './rfq-images.service';
import { CreateRFQDto, UpdateRFQDto } from './dto/rfq.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RFQPosterOnly } from '../common/decorators/auth.decorators';

class InviteSupplierDto {
  @ApiProperty() @IsString() supplierId: string;
}

@ApiTags('RFQs')
@Controller('rfqs')
export class RFQsController {
  constructor(
    private readonly rfqsService: RFQsService,
    private readonly rfqImagesService: RfqImagesService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List RFQs — public sees PUBLIC only; PLATFORM_ADMIN sees all' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', enum: RFQStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'moderationStatus', required: false })
  findAll(
    @Query() query: PaginationDto & { categoryId?: string; status?: RFQStatus; search?: string; moderationStatus?: string },
    @CurrentUser() user?: any,
  ) {
    return this.rfqsService.findAll(Object.assign(query, { adminOverride: user?.role === 'PLATFORM_ADMIN' }));
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get my company's RFQs (buyer)" })
  getMyRFQs(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    return this.rfqsService.getMyRFQs(userId, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get RFQ details — REMOVED content hidden from public, visible to owner/admin' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.rfqsService.findOne(id, user?.id);
  }

  @Post()
  @RFQPosterOnly()
  @ApiOperation({ summary: 'Create RFQ (BUYER_ADMIN, CUSTOMER, or FREELANCER)' })
  @ApiResponse({ status: 201, description: 'RFQ created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Role not allowed — only BUYER_ADMIN, CUSTOMER, FREELANCER' })
  create(@Body() dto: CreateRFQDto, @CurrentUser('id') userId: string) {
    return this.rfqsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update RFQ' })
  update(@Param('id') id: string, @Body() dto: UpdateRFQDto, @CurrentUser('id') userId: string) {
    return this.rfqsService.update(id, dto, userId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel RFQ' })
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.rfqsService.cancel(id, userId);
  }

  // ─── Image Endpoints ──────────────────────────────────────────────────────

  @Get(':id/images')
  @ApiOperation({ summary: 'Get all images for an RFQ' })
  getImages(@Param('id') rfqId: string) {
    return this.rfqImagesService.getImages(rfqId);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload images to RFQ (max 8, 5MB each, JPEG/PNG/WebP)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 8, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImages(
    @Param('id') rfqId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
  ) {
    return this.rfqImagesService.uploadImages(rfqId, files, userId);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an RFQ image' })
  deleteImage(
    @Param('id') rfqId: string,
    @Param('imageId') imageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rfqImagesService.deleteImage(rfqId, imageId, userId);
  }

  // ─── Invite Endpoints ─────────────────────────────────────────────────────

  @Post(':id/invites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Invite a verified supplier to submit a quote on this RFQ' })
  inviteSupplier(
    @Param('id') rfqId: string,
    @Body() dto: InviteSupplierDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rfqsService.inviteSupplier(rfqId, dto.supplierId, userId);
  }

  @Get(':id/invites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List invited suppliers for an RFQ' })
  getInvites(@Param('id') rfqId: string) {
    return this.rfqsService.getInvites(rfqId);
  }
}
