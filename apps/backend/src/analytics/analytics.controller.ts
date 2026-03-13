import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SELLER_ROLES, BUYER_ROLES } from '../common/constants/platform.constants';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('supplier')
  @Roles(...SELLER_ROLES)
  @ApiOperation({ summary: 'Seller analytics (SUPPLIER_ADMIN or FREELANCER)' })
  getSupplierAnalytics(@CurrentUser('companyId') companyId: string) {
    return this.analyticsService.getSupplierAnalytics(companyId);
  }

  @Get('buyer')
  @Roles(...BUYER_ROLES)
  @ApiOperation({ summary: 'Buyer analytics (BUYER_ADMIN or CUSTOMER)' })
  getBuyerAnalytics(@CurrentUser('companyId') companyId: string) {
    return this.analyticsService.getBuyerAnalytics(companyId);
  }

  @Get('supplier/export')
  @Roles(...SELLER_ROLES)
  @ApiOperation({ summary: 'Export seller analytics as CSV (PRO feature — SUPPLIER_ADMIN or FREELANCER)' })
  async exportSupplierCsv(@CurrentUser('companyId') companyId: string, @Res() res: Response) {
    const csv = await this.analyticsService.exportSupplierCsv(companyId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mwazn-supplier-analytics.csv"');
    res.send(csv);
  }

  @Get('buyer/export')
  @Roles(...BUYER_ROLES)
  @ApiOperation({ summary: 'Export buyer analytics as CSV (PRO feature — BUYER_ADMIN or CUSTOMER)' })
  async exportBuyerCsv(@CurrentUser('companyId') companyId: string, @Res() res: Response) {
    const csv = await this.analyticsService.exportBuyerCsv(companyId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mwazn-buyer-analytics.csv"');
    res.send(csv);
  }
}
