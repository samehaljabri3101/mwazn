import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all active listings (marketplace)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: PaginationDto & { categoryId?: string; supplierId?: string; search?: string }) {
    return this.listingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing details' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create listing (verified supplier only)' })
  create(@Body() dto: CreateListingDto, @CurrentUser('id') userId: string) {
    return this.listingsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update listing' })
  update(@Param('id') id: string, @Body() dto: UpdateListingDto, @CurrentUser('id') userId: string) {
    return this.listingsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archive listing' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listingsService.remove(id, userId);
  }
}
