import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('Search & Marketplace')
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Global search across vendors, products, categories' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false, description: 'suppliers|products|categories' })
  search(@Query('q') q: string, @Query('type') type?: string) {
    return this.searchService.search(q, type);
  }

  @Get('suppliers/search')
  @Public()
  @ApiOperation({ summary: 'Advanced supplier search with filters' })
  searchSuppliers(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('verified') verified?: string,
    @Query('pro') pro?: string,
    @Query('minRating') minRating?: string,
    @Query('trustTier') trustTier?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchSuppliers({
      q, category, city, trustTier,
      verified: verified !== 'false',
      pro: pro === 'true',
      minRating: minRating ? Number(minRating) : undefined,
      page: page ? Number(page) : 1,
      limit: Math.min(limit ? Number(limit) : 20, 50),
    });
  }

  @Get('listings/search')
  @Public()
  @ApiOperation({ summary: 'Advanced listing/product search with filters' })
  searchListings(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('trustTier') trustTier?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchListings({
      q, category, city, trustTier,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : 1,
      limit: Math.min(limit ? Number(limit) : 20, 50),
    });
  }

  @Get('search/suggestions')
  @Public()
  @ApiOperation({ summary: 'Typeahead suggestions for search bar' })
  @ApiQuery({ name: 'q', required: true })
  getSuggestions(@Query('q') q: string) {
    return this.searchService.getSuggestions(q);
  }

  @Get('search/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Search term analytics (admin)' })
  @ApiQuery({ name: 'days', required: false })
  getSearchAnalytics(@Query('days') days?: string) {
    return this.searchService.getSearchAnalytics(days ? Number(days) : 30);
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
  getTopVendors(@Query('limit') limit?: number) {
    return this.searchService.getTopVendors(limit ? Number(limit) : 8);
  }

  @Get('marketplace/top-products')
  @Public()
  @ApiOperation({ summary: 'Most active product listings' })
  getTopProducts(@Query('limit') limit?: number) {
    return this.searchService.getTopProducts(limit ? Number(limit) : 8);
  }

  @Get('marketplace/featured-showrooms')
  @Public()
  @ApiOperation({ summary: 'Featured supplier showrooms (PRO + Verified first)' })
  getFeaturedShowrooms(@Query('limit') limit?: number) {
    return this.searchService.getFeaturedShowrooms(limit ? Number(limit) : 6);
  }

  @Get('marketplace/latest-rfqs')
  @Public()
  @ApiOperation({ summary: 'Latest open public RFQs for homepage display' })
  getLatestRFQs(@Query('limit') limit?: number) {
    return this.searchService.getLatestRFQs(limit ? Number(limit) : 6);
  }
}
