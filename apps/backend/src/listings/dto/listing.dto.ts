import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber,
  IsOptional, IsString, Max, Min,
} from 'class-validator';
import { ListingStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export enum StockAvailability {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LIMITED = 'LIMITED',
}

export class CreateListingDto {
  @ApiProperty() @IsString() @IsNotEmpty() titleAr: string;
  @ApiProperty() @IsString() @IsNotEmpty() titleEn: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Stock Keeping Unit code' })
  @IsOptional() @IsString() sku?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() priceTo?: number;
  @ApiPropertyOptional({ default: 'SAR' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) minOrderQty?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) leadTimeDays?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];

  @ApiProperty() @IsString() @IsNotEmpty() categoryId: string;

  @ApiPropertyOptional({ description: 'Specifications as key-value pairs JSON' })
  @IsOptional() specsJson?: object;

  @ApiPropertyOptional({ default: false, description: 'Hide price, show "Request Quote" instead' })
  @IsOptional() @IsBoolean() requestQuoteOnly?: boolean;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) vatPercent?: number;

  @ApiPropertyOptional({ enum: StockAvailability, default: 'IN_STOCK' })
  @IsOptional() @IsEnum(StockAvailability) stockAvailability?: StockAvailability;
}

export class UpdateListingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() priceTo?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) minOrderQty?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) leadTimeDays?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];
  @ApiPropertyOptional({ enum: ListingStatus }) @IsOptional() @IsEnum(ListingStatus) status?: ListingStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() specsJson?: object;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requestQuoteOnly?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) vatPercent?: number;
  @ApiPropertyOptional({ enum: StockAvailability }) @IsOptional() @IsEnum(StockAvailability) stockAvailability?: StockAvailability;
}
