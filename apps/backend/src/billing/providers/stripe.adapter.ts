import { Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentProvider, CheckoutParams, CheckoutResult, WebhookResult } from './payment-provider.interface';

export class StripeAdapter implements PaymentProvider {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeAdapter.name);
  private readonly webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any });
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: { name: `Mwazn ${params.plan} Plan` },
              unit_amount: params.amount,
            },
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: { companyId: params.companyId, plan: params.plan, ...params.metadata },
      });

      return { checkoutUrl: session.url!, sessionId: session.id, isMock: false };
    } catch (err: any) {
      this.logger.warn(`Stripe checkout failed: ${err.message}`);
      return { checkoutUrl: params.cancelUrl, isMock: true };
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookResult | null> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        typeof payload === 'string' ? payload : JSON.stringify(payload),
        signature,
        this.webhookSecret,
      );
    } catch (err: any) {
      this.logger.warn(`Stripe webhook signature invalid: ${err.message}`);
      return null;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid' && session.metadata?.companyId) {
        return {
          companyId: session.metadata.companyId,
          plan: session.metadata.plan ?? 'PRO',
          amount: session.amount_total ?? 0,
          currency: session.currency?.toUpperCase() ?? 'SAR',
          reference: session.payment_intent as string,
          status: 'paid',
        };
      }
    }

    return null;
  }

  async verifyPayment(paymentId: string): Promise<boolean> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentId);
      return intent.status === 'succeeded';
    } catch {
      return false;
    }
  }
}
