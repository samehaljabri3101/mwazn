import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Res, BadRequestException,
  UseInterceptors, UploadedFiles, UploadedFile, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SellerOnly } from '../common/decorators/auth.decorators';

@ApiTags('Listings')
@Controller()
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // ─── Bulk Import ────────────────────────────────────────────────────────────

  @Get('listings/bulk-import/template')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Download bulk import Excel template' })
  getBulkImportTemplate(@Res() res: Response) {
    const buffer = this.listingsService.getBulkImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mwazn-bulk-import-template.xlsx"');
    res.send(buffer);
  }

  @Post('listings/bulk-import')
  @SellerOnly()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk import products from Excel (SUPPLIER_ADMIN or FREELANCER, verified)' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10_485_760 } }))
  bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.listingsService.bulkImport(file, userId);
  }

  // ─── Public marketplace ─────────────────────────────────────────────────────

  @Get('listings')
  @ApiOperation({ summary: 'Browse all active listings (marketplace)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['price_asc', 'price_desc', 'popular'] })
  findAll(@Query() query: PaginationDto & {
    categoryId?: string; supplierId?: string; search?: string;
    minPrice?: number; maxPrice?: number; sort?: string;
  }) {
    return this.listingsService.findAll(query);
  }

  @Get('listings/:id/similar')
  @ApiOperation({ summary: 'Get similar listings' })
  getSimilar(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
  ) {
    return this.listingsService.getSimilar(id, limit);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing details (by ID or slug)' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  // ─── Authenticated CRUD ─────────────────────────────────────────────────────

  @Post('listings')
  @SellerOnly()
  @ApiOperation({ summary: 'Create listing (SUPPLIER_ADMIN or FREELANCER, verified)' })
  create(@Body() dto: CreateListingDto, @CurrentUser('id') userId: string) {
    return this.listingsService.create(dto, userId);
  }

  @Patch('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update listing' })
  update(@Param('id') id: string, @Body() dto: UpdateListingDto, @CurrentUser('id') userId: string) {
    return this.listingsService.update(id, dto, userId);
  }

  @Delete('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archive listing' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listingsService.remove(id, userId);
  }

  // ─── Image management ───────────────────────────────────────────────────────

  @Post('listings/:id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload images to a listing (max 8)' })
  @UseInterceptors(FilesInterceptor('files', 8, { storage: memoryStorage() }))
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
  ) {
    return this.listingsService.uploadImages(id, files, userId);
  }

  @Delete('listings/:id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a listing image' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.listingsService.deleteImage(id, imageId, userId);
  }
}
