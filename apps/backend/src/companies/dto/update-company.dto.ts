import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LegalForm, CompanySizeRange } from '../../auth/dto/register-supplier.dto';
import { SubscriptionPlan } from '@prisma/client';

export class UpdateCompanyDto {
  // ── Names & basic ─────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImageUrl?: string;

  // ── Legal & compliance ────────────────────────────────
  @ApiPropertyOptional({ example: '310000000000003' })
  @IsOptional() @IsString()
  @Matches(/^\d{15}$/, { message: 'VAT number must be 15 digits' })
  vatNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() crExpiryDate?: string;

  @ApiPropertyOptional({ enum: LegalForm })
  @IsOptional() @IsEnum(LegalForm) legalForm?: LegalForm;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(new Date().getFullYear())
  establishmentYear?: number;

  @ApiPropertyOptional({ enum: CompanySizeRange })
  @IsOptional() @IsEnum(CompanySizeRange) companySizeRange?: CompanySizeRange;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) sectors?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() contactJobTitle?: string;

  // ── Supplier profile extras ───────────────────────────
  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) keyClients?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) regionsServed?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) paymentTermsAccepted?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() productionCapacity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() isoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() chamberCertUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taxCertUrl?: string;

  // ── Commerce Integration ──────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasExternalStore?: boolean;
  @ApiPropertyOptional({ enum: ['ZID', 'SALLA', 'OTHER'] })
  @IsOptional() @IsString() externalStorePlatform?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() externalStoreUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() externalStoreName?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowDirectOrder?: boolean;

  // ── Admin-only ────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Internal admin notes (admin only)' })
  @IsOptional() @IsString() adminNotes?: string;

  @ApiPropertyOptional({ enum: SubscriptionPlan, description: 'Subscription plan (admin only)' })
  @IsOptional() @IsEnum(SubscriptionPlan) plan?: SubscriptionPlan;
}
