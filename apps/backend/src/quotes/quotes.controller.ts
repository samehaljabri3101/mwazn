import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Quotes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get my submitted quotes (supplier)' })
  getMyQuotes(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    return this.quotesService.findMyQuotes(userId, query);
  }

  @Get('rfq/:rfqId')
  @ApiOperation({ summary: 'Get all quotes for an RFQ' })
  findByRFQ(@Param('rfqId') rfqId: string, @CurrentUser('id') userId: string) {
    return this.quotesService.findByRFQ(rfqId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a quote (verified supplier, quota enforced)' })
  create(@Body() dto: CreateQuoteDto, @CurrentUser('id') userId: string) {
    return this.quotesService.create(dto, userId);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a quote (buyer) — creates deal automatically' })
  accept(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.quotesService.accept(id, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a quote (buyer)' })
  reject(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.quotesService.reject(id, userId);
  }

  @Patch(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw a quote (supplier)' })
  withdraw(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.quotesService.withdraw(id, userId);
  }
}
