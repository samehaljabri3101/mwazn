import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @ApiProperty() @IsString() @IsNotEmpty() rfqId: string;

  @ApiProperty({ description: 'Total price in SAR' })
  @Type(() => Number) @IsNumber() price: number;

  @ApiPropertyOptional({ default: 'SAR' }) @IsOptional() @IsString() currency?: string;

  @ApiPropertyOptional({ description: 'Delivery days from acceptance' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) deliveryDays?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() listingId?: string;

  // ── Commercial terms ──────────────────────────────────
  @ApiPropertyOptional({ example: 15, description: 'VAT percentage (e.g. 15 for 15%)' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) vatPercent?: number;

  @ApiPropertyOptional({ example: '30 days net', description: 'Payment terms' })
  @IsOptional() @IsString() paymentTerms?: string;

  @ApiPropertyOptional({ example: 12, description: 'Warranty period in months' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) warrantyMonths?: number;

  @ApiPropertyOptional({ description: 'After-sales support details' })
  @IsOptional() @IsString() afterSalesSupport?: string;

  // ── Technical ─────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Technical proposal / approach' })
  @IsOptional() @IsString() technicalProposal?: string;

  @ApiPropertyOptional({
    description: 'Line items as JSON array: [{description, qty, unit, unitPrice}]',
  })
  @IsOptional() lineItems?: object[];
}

export class UpdateQuoteDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) vatPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentTerms?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) warrantyMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() afterSalesSupport?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() technicalProposal?: string;
  @ApiPropertyOptional() @IsOptional() lineItems?: object[];
}
