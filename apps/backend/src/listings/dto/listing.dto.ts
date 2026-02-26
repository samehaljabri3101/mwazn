import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { ListingStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @ApiProperty() @IsString() @IsNotEmpty() titleAr: string;
  @ApiProperty() @IsString() @IsNotEmpty() titleEn: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional({ default: 'SAR' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) minOrderQty?: number;
  @ApiProperty() @IsString() @IsNotEmpty() categoryId: string;
}

export class UpdateListingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) minOrderQty?: number;
  @ApiPropertyOptional({ enum: ListingStatus }) @IsOptional() @IsEnum(ListingStatus) status?: ListingStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
}
