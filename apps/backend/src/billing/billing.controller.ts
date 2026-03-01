import {
  Controller, Post, Get, Patch, Body, Headers, Param,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create payment checkout session' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async checkout(@Request() req: any) {
    return this.billing.createCheckout(req.user.companyId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Payment webhook endpoint (Stripe/Moyasar)' })
  async webhook(
    @Body() payload: any,
    @Headers('stripe-signature') stripeSignature: string,
    @Headers('x-moyasar-signature') moyasarSignature: string,
  ) {
    const signature = stripeSignature || moyasarSignature || '';
    await this.billing.handleWebhook(payload, signature);
    return { received: true };
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List my invoices' })
  getInvoices(@Request() req: any) {
    return this.billing.getInvoices(req.user.companyId);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my subscription status' })
  getSubscription(@Request() req: any) {
    return this.billing.getSubscription(req.user.companyId);
  }

  // Admin-only
  @Get('admin/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] List all invoices' })
  adminListInvoices() {
    return this.billing.adminListInvoices();
  }

  @Patch('admin/invoices/:id/mark-paid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Manually mark invoice as paid' })
  markPaid(@Param('id') id: string, @Request() req: any) {
    return this.billing.markPaid(id, req.user.id);
  }
}
