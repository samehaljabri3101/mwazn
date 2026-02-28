import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Invoices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Download ZATCA-compliant e-invoice XML for a deal' })
  async getInvoice(@Param('id') dealId: string, @Res() res: Response) {
    const { xml, invoiceNumber, isMock } = await this.invoiceService.generateForDeal(dealId);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.xml"`);
    res.setHeader('X-Invoice-Mock', String(isMock));
    res.send(xml);
  }
}
