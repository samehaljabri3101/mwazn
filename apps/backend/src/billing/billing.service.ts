import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider, CheckoutResult } from './providers/payment-provider.interface';
import { StripeAdapter } from './providers/stripe.adapter';
import { StubAdapter } from './providers/stub.adapter';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly provider: PaymentProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const stripeKey = config.get<string>('STRIPE_SECRET_KEY') ?? '';
    const stripeWebhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';

    if (stripeKey) {
      this.provider = new StripeAdapter(stripeKey, stripeWebhookSecret);
      this.logger.log('Payment provider: Stripe (live)');
    } else {
      this.provider = new StubAdapter();
      this.logger.log('Payment provider: Stub (no STRIPE_SECRET_KEY set)');
    }
  }

  async createCheckout(companyId: string): Promise<CheckoutResult> {
    const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
    const result = await this.provider.createCheckoutSession({
      companyId,
      plan: 'PRO',
      amount: 29900, // SAR 299 in halalas
      currency: 'SAR',
      successUrl: `${frontendUrl}/dashboard/subscription?status=success`,
      cancelUrl: `${frontendUrl}/dashboard/subscription?status=cancelled`,
      metadata: { companyId },
    });

    // Create a pending invoice
    if (!result.isMock) {
      await this.prisma.invoice.create({
        data: {
          companyId,
          plan: 'PRO',
          amount: 299,
          currency: 'SAR',
          status: 'PENDING',
          provider: 'stripe',
          reference: result.sessionId,
        },
      });
    }

    return result;
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    const result = await this.provider.handleWebhook(payload, signature);
    if (!result) return;

    if (result.status === 'paid') {
      await this.prisma.$transaction([
        this.prisma.company.update({
          where: { id: result.companyId },
          data: {
            plan: 'PRO',
            planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        }),
        this.prisma.invoice.create({
          data: {
            companyId: result.companyId,
            plan: result.plan,
            amount: result.amount / 100,
            currency: result.currency,
            status: 'PAID',
            provider: 'stripe',
            reference: result.reference,
            paidAt: new Date(),
          },
        }),
      ]);
      this.logger.log(`Company ${result.companyId} upgraded to PRO via webhook`);
    }
  }

  async getInvoices(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markPaid(invoiceId: string, adminUserId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      }),
      this.prisma.company.update({
        where: { id: invoice.companyId },
        data: {
          plan: 'PRO',
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    this.logger.log(`Invoice ${invoiceId} marked paid by admin ${adminUserId}`);
  }

  async getSubscription(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, planExpiresAt: true, quotesUsedThisMonth: true, quotaResetAt: true },
    });
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { companyId, status: 'PAID' },
      orderBy: { paidAt: 'desc' },
    });

    return {
      plan: company?.plan ?? 'FREE',
      planExpiresAt: company?.planExpiresAt,
      quotesUsedThisMonth: company?.quotesUsedThisMonth ?? 0,
      quotaResetAt: company?.quotaResetAt,
      lastPaidAt: lastInvoice?.paidAt,
      paymentGatewayEnabled: !(this.provider instanceof StubAdapter),
    };
  }

  /** Daily cron: downgrade expired PRO subscriptions to FREE */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireSubscriptions(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.company.updateMany({
      where: { plan: 'PRO', planExpiresAt: { lt: now } },
      data: { plan: 'FREE', planExpiresAt: null },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} PRO subscriptions → FREE`);
    }
  }

  /** Daily cron: reset monthly quote counters */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetQuotaCounters(): Promise<void> {
    await this.prisma.company.updateMany({
      where: {},
      data: { quotesUsedThisMonth: 0, quotaResetAt: new Date() },
    });
    this.logger.log('Monthly quote quotas reset');
  }

  async adminListInvoices(status?: string) {
    return this.prisma.invoice.findMany({
      where: status ? { status: status as any } : {},
      include: { company: { select: { nameEn: true, nameAr: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
