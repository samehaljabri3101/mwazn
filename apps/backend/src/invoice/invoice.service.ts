import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = config.get<string>('ZATCA_API_KEY') || '';
    this.apiUrl = config.get<string>('ZATCA_API_URL') || 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
  }

  async generateForDeal(dealId: string): Promise<{ xml: string; invoiceNumber: string; isMock: boolean }> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        buyer: { select: { nameAr: true, nameEn: true, crNumber: true, city: true } },
        supplier: { select: { nameAr: true, nameEn: true, crNumber: true, city: true } },
        quote: { include: { rfq: { select: { title: true } } } },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');

    const invoiceNumber = `MWZ-${deal.id.slice(-8).toUpperCase()}`;
    const issueDate = new Date().toISOString().split('T')[0];
    const xml = this.buildZatcaXml(deal, invoiceNumber, issueDate);

    if (!this.apiKey) {
      this.logger.log(`[INVOICE STUB] Generated local XML for deal ${dealId} — invoice ${invoiceNumber}`);
      return { xml, invoiceNumber, isMock: true };
    }

    try {
      const response = await fetch(`${this.apiUrl}/invoices/reporting/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': 'en',
          'Accept-Version': 'V2',
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        },
        body: JSON.stringify({ invoiceHash: '', uuid: invoiceNumber, invoice: Buffer.from(xml).toString('base64') }),
      });

      if (!response.ok) throw new Error(`ZATCA API error: ${response.status}`);
      return { xml, invoiceNumber, isMock: false };
    } catch (err: any) {
      this.logger.warn(`ZATCA submission failed: ${err.message}; returning local XML`);
      return { xml, invoiceNumber, isMock: true };
    }
  }

  private buildZatcaXml(deal: any, invoiceNumber: string, issueDate: string): string {
    const amount = Number(deal.totalAmount).toFixed(2);
    const vat = (Number(deal.totalAmount) * 0.15).toFixed(2);
    const total = (Number(deal.totalAmount) * 1.15).toFixed(2);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${deal.supplier.nameEn}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>
      <cac:PartyTaxScheme><cbc:CompanyID>${deal.supplier.crNumber}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${deal.buyer.nameEn}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>
      <cac:PartyTaxScheme><cbc:CompanyID>${deal.buyer.crNumber}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${vat}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${amount}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${amount}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${amount}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Name>${deal.quote?.rfq?.title || 'B2B Transaction'}</cbc:Name></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="SAR">${amount}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
</Invoice>`;
  }
}
