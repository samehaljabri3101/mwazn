import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @ApiProperty() @IsString() @IsNotEmpty() rfqId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() price: number;
  @ApiPropertyOptional({ default: 'SAR' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() listingId?: string;
}

export class UpdateQuoteDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
}
