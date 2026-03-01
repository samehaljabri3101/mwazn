export interface CheckoutParams {
  companyId: string;
  plan: string;
  amount: number; // in smallest currency unit (halalas for SAR, cents for USD)
  currency: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId?: string;
  isMock: boolean;
}

export interface WebhookResult {
  companyId: string;
  plan: string;
  amount: number;
  currency: string;
  reference: string;
  status: 'paid' | 'failed' | 'refunded';
}

export interface PaymentProvider {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
  handleWebhook(payload: any, signature: string): Promise<WebhookResult | null>;
  verifyPayment(paymentId: string): Promise<boolean>;
}
