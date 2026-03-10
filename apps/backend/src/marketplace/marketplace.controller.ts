import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';

@ApiTags('Search & Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get marketplace statistics' })
  getStats() {
    return this.marketplaceService.getStats();
  }

  @Get('top-vendors')
  @ApiOperation({ summary: 'Get top rated vendors' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopVendors(@Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number) {
    return this.marketplaceService.getTopVendors(limit);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top products by view count' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(@Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number) {
    return this.marketplaceService.getTopProducts(limit);
  }

  @Get('featured-showrooms')
  @ApiOperation({ summary: 'Get featured supplier showrooms' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFeaturedShowrooms(@Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number) {
    return this.marketplaceService.getFeaturedShowrooms(limit);
  }
}
