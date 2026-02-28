import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.secretKey = config.get<string>('MOYASAR_SECRET_KEY') || '';
    this.webhookSecret = config.get<string>('MOYASAR_WEBHOOK_SECRET') || '';
  }

  async createCheckout(companyId: string, plan = 'PRO'): Promise<{ checkoutUrl: string; isMock: boolean }> {
    if (!this.secretKey) {
      this.logger.log(`[PAYMENT STUB] Checkout requested for company ${companyId} — plan ${plan}`);
      return { checkoutUrl: 'mailto:pro@mwazn.sa', isMock: true };
    }

    try {
      const response = await fetch('https://api.moyasar.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        },
        body: JSON.stringify({
          amount: 29900, // SAR 299/month in halalas
          currency: 'SAR',
          description: `Mwazn PRO Subscription — ${plan}`,
          source: { type: 'creditcard' },
          callback_url: `${this.config.get('FRONTEND_URL')}/dashboard/subscription?status=success`,
          metadata: { companyId, plan },
        }),
      });

      if (!response.ok) throw new Error(`Moyasar API error: ${response.status}`);
      const data: any = await response.json();
      return { checkoutUrl: data.source?.transaction_url || data.checkout_url, isMock: false };
    } catch (err: any) {
      this.logger.warn(`Moyasar checkout failed: ${err.message}; using stub`);
      return { checkoutUrl: 'mailto:pro@mwazn.sa', isMock: true };
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    if (this.webhookSecret) {
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (signature !== expected) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    if (payload.type === 'payment_paid' && payload.data?.metadata?.companyId) {
      const companyId = payload.data.metadata.companyId;
      await this.prisma.company.update({
        where: { id: companyId },
        data: { plan: 'PRO' },
      });
      this.logger.log(`Company ${companyId} upgraded to PRO via Moyasar webhook`);
    }
  }

  async getSubscription(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, quotesUsedThisMonth: true, quotaResetAt: true },
    });
    return {
      plan: company?.plan ?? 'FREE',
      quotesUsedThisMonth: company?.quotesUsedThisMonth ?? 0,
      quotaResetAt: company?.quotaResetAt,
      paymentGatewayEnabled: !!this.secretKey,
    };
  }
}
