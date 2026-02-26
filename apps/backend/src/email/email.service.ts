import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mode: string;

  constructor(private readonly config: ConfigService) {
    this.mode = config.get<string>('EMAIL_MODE') || 'log';
  }

  async send(payload: EmailPayload): Promise<void> {
    if (this.mode === 'log') {
      this.logger.log(
        `[EMAIL] To: ${payload.to} | Subject: ${payload.subject}\n${payload.html}`,
      );
      return;
    }
    // SMTP mode — add nodemailer integration here
    this.logger.warn('SMTP mode not configured; falling back to log');
    this.logger.log(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  async sendWelcome(email: string, name: string) {
    await this.send({
      to: email,
      subject: 'Welcome to Mwazn — منصة موازن',
      html: `<p>Hello ${name}, welcome to Mwazn B2B Marketplace!</p>`,
    });
  }

  async sendQuoteReceived(buyerEmail: string, rfqTitle: string) {
    await this.send({
      to: buyerEmail,
      subject: `New quote received for "${rfqTitle}"`,
      html: `<p>A supplier submitted a new quote for your RFQ: <strong>${rfqTitle}</strong>.</p>`,
    });
  }

  async sendQuoteAccepted(supplierEmail: string, rfqTitle: string) {
    await this.send({
      to: supplierEmail,
      subject: `Your quote was accepted — "${rfqTitle}"`,
      html: `<p>Congratulations! Your quote for <strong>${rfqTitle}</strong> has been accepted.</p>`,
    });
  }

  async sendDealStatusChanged(email: string, dealId: string, status: string) {
    await this.send({
      to: email,
      subject: `Deal status updated: ${status}`,
      html: `<p>Deal #${dealId} has been updated to status: <strong>${status}</strong>.</p>`,
    });
  }

  async sendNewMessage(email: string, senderName: string) {
    await this.send({
      to: email,
      subject: `New message from ${senderName}`,
      html: `<p>You have a new message from <strong>${senderName}</strong> on Mwazn.</p>`,
    });
  }

  async sendVerificationResult(email: string, status: 'VERIFIED' | 'REJECTED') {
    const subject =
      status === 'VERIFIED' ? 'Your company has been verified!' : 'Verification update';
    const body =
      status === 'VERIFIED'
        ? '<p>Your company has been verified. You can now submit quotes on Mwazn.</p>'
        : '<p>Your verification request was not approved. Please contact support for more info.</p>';
    await this.send({ to: email, subject, html: body });
  }
}
