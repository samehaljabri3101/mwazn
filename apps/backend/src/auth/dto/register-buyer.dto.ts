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
import { LegalForm, CompanySizeRange } from './register-supplier.dto';

export class RegisterBuyerDto {
  // ── Company ───────────────────────────────────────────
  @ApiProperty({ example: 'مجموعة الأفق للمشتريات' })
  @IsString()
  @IsNotEmpty()
  companyNameAr: string;

  @ApiProperty({ example: 'Horizon Procurement Group' })
  @IsString()
  @IsNotEmpty()
  companyNameEn: string;

  @ApiProperty({ example: '9876543210', description: '10-digit CR number' })
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectors?: string[];

  @ApiPropertyOptional({ example: 'Jeddah' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+966509876543' })
  @IsOptional()
  @IsString()
  phone?: string;

  // ── Admin user ────────────────────────────────────────
  @ApiProperty({ example: 'Sara Al-Qahtani' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: 'Procurement Manager' })
  @IsOptional()
  @IsString()
  contactJobTitle?: string;

  @ApiProperty({ example: 'admin@horizonprocurement.sa' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
