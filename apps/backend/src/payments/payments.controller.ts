import { Controller, Post, Get, Body, Headers, UseGuards, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateCheckoutDto {
  @ApiPropertyOptional() @IsOptional() @IsString() plan?: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a Moyasar checkout session (stub if no key)' })
  createCheckout(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckout(companyId, dto.plan || 'PRO');
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Moyasar payment webhook receiver' })
  handleWebhook(
    @Body() payload: any,
    @Headers('x-moyasar-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current subscription status' })
  getSubscription(@CurrentUser('companyId') companyId: string) {
    return this.paymentsService.getSubscription(companyId);
  }
}
