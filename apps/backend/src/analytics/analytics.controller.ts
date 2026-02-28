import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('supplier')
  @ApiOperation({ summary: 'Supplier analytics for the authenticated user' })
  getSupplierAnalytics(@CurrentUser('companyId') companyId: string) {
    return this.analyticsService.getSupplierAnalytics(companyId);
  }

  @Get('buyer')
  @ApiOperation({ summary: 'Buyer analytics for the authenticated user' })
  getBuyerAnalytics(@CurrentUser('companyId') companyId: string) {
    return this.analyticsService.getBuyerAnalytics(companyId);
  }
}
