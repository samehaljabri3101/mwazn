import { Logger } from '@nestjs/common';
import { PaymentProvider, CheckoutParams, CheckoutResult, WebhookResult } from './payment-provider.interface';

/** Used when no payment gateway key is configured. Logs and returns mailto link. */
export class StubAdapter implements PaymentProvider {
  private readonly logger = new Logger(StubAdapter.name);

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
    this.logger.log(`[PAYMENT STUB] Checkout for company=${params.companyId} plan=${params.plan} amount=${params.amount} ${params.currency}`);
    return { checkoutUrl: 'mailto:pro@mwazn.sa', isMock: true };
  }

  async handleWebhook(_payload: any, _signature: string): Promise<WebhookResult | null> {
    return null;
  }

  async verifyPayment(_paymentId: string): Promise<boolean> {
    return false;
  }
}
