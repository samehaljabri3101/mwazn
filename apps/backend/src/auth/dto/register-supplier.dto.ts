import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LegalForm {
  LLC = 'LLC',
  ESTABLISHMENT = 'ESTABLISHMENT',
  CORPORATION = 'CORPORATION',
  PARTNERSHIP = 'PARTNERSHIP',
  JOINT_STOCK = 'JOINT_STOCK',
}

export enum CompanySizeRange {
  S1_10 = '1-10',
  S11_50 = '11-50',
  S51_200 = '51-200',
  S201_500 = '201-500',
  S500_PLUS = '500+',
}

export class RegisterSupplierDto {
  // ── Company ───────────────────────────────────────────
  @ApiProperty({ example: 'شركة النخبة للتوريد' })
  @IsString()
  @IsNotEmpty()
  companyNameAr: string;

  @ApiProperty({ example: 'Elite Supply Co.' })
  @IsString()
  @IsNotEmpty()
  companyNameEn: string;

  @ApiProperty({ example: '1234567890', description: '10-digit CR number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'CR number must be exactly 10 digits' })
  crNumber: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  crExpiryDate?: string;

  @ApiPropertyOptional({ example: '310000000000003', description: '15-digit VAT number' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{15}$/, { message: 'VAT number must be exactly 15 digits' })
  vatNumber?: string;

  @ApiPropertyOptional({ enum: LegalForm })
  @IsOptional()
  @IsEnum(LegalForm)
  legalForm?: LegalForm;

  @ApiPropertyOptional({ example: 2010 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  establishmentYear?: number;

  @ApiPropertyOptional({ enum: CompanySizeRange })
  @IsOptional()
  @IsEnum(CompanySizeRange)
  companySizeRange?: CompanySizeRange;

  @ApiPropertyOptional({ type: [String], example: ['building-materials', 'industrial-equipment'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectors?: string[];

  @ApiPropertyOptional({ example: 'Riyadh' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+966501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  // ── Admin user ────────────────────────────────────────
  @ApiProperty({ example: 'Mohammed Al-Rashid' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsOptional()
  @IsString()
  contactJobTitle?: string;

  @ApiProperty({ example: 'admin@elitesupply.sa' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
