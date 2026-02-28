import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SearchService } from './search.service';

@ApiTags('Search & Marketplace')
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Global search across vendors, products, categories' })
  @ApiQuery({ name: 'q', description: 'Search query (min 2 chars)', required: true })
  search(@Query('q') q: string) {
    return this.searchService.search(q);
  }

  @Get('marketplace/stats')
  @Public()
  @ApiOperation({ summary: 'Live marketplace statistics for homepage' })
  getStats() {
    return this.searchService.getMarketplaceStats();
  }

  @Get('marketplace/top-vendors')
  @Public()
  @ApiOperation({ summary: 'Top rated verified suppliers' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of vendors (default 8)' })
  getTopVendors(@Query('limit') limit?: number) {
    return this.searchService.getTopVendors(limit ? Number(limit) : 8);
  }

  @Get('marketplace/top-products')
  @Public()
  @ApiOperation({ summary: 'Most active product listings' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products (default 8)' })
  getTopProducts(@Query('limit') limit?: number) {
    return this.searchService.getTopProducts(limit ? Number(limit) : 8);
  }

  @Get('marketplace/featured-showrooms')
  @Public()
  @ApiOperation({ summary: 'Featured supplier showrooms (PRO + Verified first)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of showrooms (default 6)' })
  getFeaturedShowrooms(@Query('limit') limit?: number) {
    return this.searchService.getFeaturedShowrooms(limit ? Number(limit) : 6);
  }
}
