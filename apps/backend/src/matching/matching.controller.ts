import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('rfq/:id/suppliers')
  @UseGuards(JwtAuthGuard)
  matchSuppliersForRFQ(@Param('id') id: string) {
    return this.matching.matchSuppliersForRFQ(id);
  }

  @Get('rfq/:id/insights')
  @UseGuards(OptionalJwtAuthGuard)
  getRFQInsights(@Param('id') id: string) {
    return this.matching.getRFQInsights(id);
  }

  @Get('supplier/opportunities')
  @UseGuards(JwtAuthGuard)
  getOpportunities(@Request() req: any) {
    return this.matching.matchRFQsForSupplier(req.user.companyId);
  }
}
