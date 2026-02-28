import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mode: string;
  private transporter: any;

  constructor(private readonly config: ConfigService) {
    this.mode = config.get<string>('EMAIL_MODE') || 'log';
    if (this.mode === 'smtp') {
      this.initSmtp();
    }
  }

  private async initSmtp() {
    try {
      const nodemailer = await import('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST'),
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: false,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    } catch {
      this.logger.warn('nodemailer not available; falling back to log mode');
    }
  }

  private htmlWrap(titleEn: string, titleAr: string, bodyEn: string, bodyAr: string): string {
    return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${titleEn}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%); padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .body h2 { color: #1e3a5f; font-size: 17px; margin: 0 0 8px; }
    .body p { color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 12px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .ar { direction: rtl; text-align: right; font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; }
    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    .btn { display: inline-block; background: #1e40af; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Mwazn | موازن</h1>
      <p>Saudi B2B Procurement Marketplace</p>
    </div>
    <div class="body">
      <h2>${titleEn}</h2>
      <p>${bodyEn}</p>
      <hr class="divider" />
      <div class="ar">
        <h2>${titleAr}</h2>
        <p>${bodyAr}</p>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Mwazn Platform — مجمع موازن للمشتريات</p>
      <p style="margin-top:4px">This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
  }

  async send(payload: EmailPayload): Promise<void> {
    if (this.mode === 'smtp' && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.get('EMAIL_FROM') || 'no-reply@mwazn.sa',
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });
        return;
      } catch (err: any) {
        this.logger.warn(`SMTP send failed: ${err.message}; falling back to log`);
      }
    }
    this.logger.log(
      `[EMAIL] To: ${payload.to} | Subject: ${payload.subject}\n${payload.text || payload.subject}`,
    );
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  async sendWelcome(email: string, name: string) {
    await this.send({
      to: email,
      subject: 'Welcome to Mwazn — منصة موازن',
      html: this.htmlWrap(
        `Welcome to Mwazn, ${name}!`,
        `مرحباً بك في موازن، ${name}!`,
        'Your account has been created successfully. You can now start exploring the Saudi B2B marketplace.',
        'تم إنشاء حسابك بنجاح. يمكنك الآن البدء في استكشاف منصة موازن للمشتريات.',
      ),
      text: `Hello ${name}, welcome to Mwazn B2B Marketplace!`,
    });
  }

  async sendQuoteReceived(buyerEmail: string, rfqTitle: string) {
    await this.send({
      to: buyerEmail,
      subject: `New quote received — "${rfqTitle}"`,
      html: this.htmlWrap(
        'New Quote Received',
        'عرض سعر جديد',
        `A supplier has submitted a new quote for your RFQ: <strong>${rfqTitle}</strong>. Log in to review and compare quotes.`,
        `قدّم أحد الموردين عرض سعر جديداً لطلبك: <strong>${rfqTitle}</strong>. سجّل دخولك لمراجعة العروض.`,
      ),
      text: `A supplier submitted a new quote for your RFQ: ${rfqTitle}.`,
    });
  }

  async sendQuoteAccepted(supplierEmail: string, rfqTitle: string) {
    await this.send({
      to: supplierEmail,
      subject: `Your quote was accepted — "${rfqTitle}"`,
      html: this.htmlWrap(
        'Quote Accepted!',
        'تم قبول عرضك!',
        `Congratulations! Your quote for <strong>${rfqTitle}</strong> has been accepted. A deal has been created — log in to track its progress.`,
        `تهانينا! تم قبول عرض السعر الخاص بك لطلب <strong>${rfqTitle}</strong>. تم إنشاء صفقة جديدة — سجّل دخولك لمتابعة التقدم.`,
      ),
      text: `Your quote for ${rfqTitle} has been accepted.`,
    });
  }

  async sendDealStatusChanged(email: string, dealId: string, status: string) {
    const statusMapEn: Record<string, string> = {
      IN_PROGRESS: 'In Progress',
      DELIVERED: 'Delivered',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    const statusMapAr: Record<string, string> = {
      IN_PROGRESS: 'قيد التنفيذ',
      DELIVERED: 'تم التسليم',
      COMPLETED: 'مكتملة',
      CANCELLED: 'ملغاة',
    };
    await this.send({
      to: email,
      subject: `Deal status updated: ${statusMapEn[status] || status}`,
      html: this.htmlWrap(
        `Deal Status: ${statusMapEn[status] || status}`,
        `حالة الصفقة: ${statusMapAr[status] || status}`,
        `Deal #${dealId} has been updated to <strong>${statusMapEn[status] || status}</strong>. Log in to Mwazn to view details.`,
        `تم تحديث الصفقة #${dealId} إلى <strong>${statusMapAr[status] || status}</strong>. سجّل دخولك لعرض التفاصيل.`,
      ),
      text: `Deal #${dealId} status: ${status}.`,
    });
  }

  async sendNewMessage(email: string, senderName: string) {
    await this.send({
      to: email,
      subject: `New message from ${senderName} — موازن`,
      html: this.htmlWrap(
        'New Message',
        'رسالة جديدة',
        `You have a new message from <strong>${senderName}</strong> on Mwazn. Log in to reply.`,
        `لديك رسالة جديدة من <strong>${senderName}</strong> على منصة موازن. سجّل دخولك للرد.`,
      ),
      text: `New message from ${senderName} on Mwazn.`,
    });
  }

  async sendVerificationResult(email: string, status: 'VERIFIED' | 'REJECTED') {
    const isVerified = status === 'VERIFIED';
    await this.send({
      to: email,
      subject: isVerified ? 'Company Verified — موازن' : 'Verification Update — موازن',
      html: this.htmlWrap(
        isVerified ? 'Company Verified!' : 'Verification Update',
        isVerified ? 'تم توثيق شركتك!' : 'تحديث حالة التوثيق',
        isVerified
          ? 'Great news! Your company has been verified on Mwazn. You can now submit quotes on open RFQs.'
          : 'Your verification request was reviewed. Please contact support for more information.',
        isVerified
          ? 'بشرى سارة! تم توثيق شركتك على منصة موازن. يمكنك الآن تقديم عروض الأسعار على الطلبات المفتوحة.'
          : 'تمت مراجعة طلب التوثيق الخاص بك. يرجى التواصل مع الدعم للمزيد من المعلومات.',
      ),
      text: isVerified ? 'Your company has been verified.' : 'Verification update — contact support.',
    });
  }

  async sendRFQInvite(email: string, rfqTitle: string, rfqId: string) {
    await this.send({
      to: email,
      subject: `You're invited to quote on "${rfqTitle}" — موازن`,
      html: this.htmlWrap(
        'RFQ Invitation',
        'دعوة لتقديم عرض سعر',
        `You have been invited to submit a quote for: <strong>${rfqTitle}</strong>. Log in to view the full details and submit your quote.`,
        `تمت دعوتك لتقديم عرض سعر على: <strong>${rfqTitle}</strong>. سجّل دخولك لعرض التفاصيل وتقديم عرضك.`,
      ),
      text: `You are invited to quote on RFQ: ${rfqTitle}.`,
    });
  }
}
