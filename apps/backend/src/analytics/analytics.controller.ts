import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('supplier/export')
  @ApiOperation({ summary: 'Export supplier analytics as CSV (PRO feature)' })
  async exportSupplierCsv(@CurrentUser('companyId') companyId: string, @Res() res: Response) {
    const csv = await this.analyticsService.exportSupplierCsv(companyId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mwazn-supplier-analytics.csv"');
    res.send(csv);
  }

  @Get('buyer/export')
  @ApiOperation({ summary: 'Export buyer analytics as CSV (PRO feature)' })
  async exportBuyerCsv(@CurrentUser('companyId') companyId: string, @Res() res: Response) {
    const csv = await this.analyticsService.exportBuyerCsv(companyId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mwazn-buyer-analytics.csv"');
    res.send(csv);
  }
}
