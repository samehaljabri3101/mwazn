import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { CompanyType } from '@prisma/client';

export class RegisterDto {
  // ── Company ──────────────────────────────────────────
  @ApiProperty({ example: 'شركة النخبة التجارية' })
  @IsString()
  @IsNotEmpty()
  companyNameAr: string;

  @ApiProperty({ example: 'Elite Trading Co.' })
  @IsString()
  @IsNotEmpty()
  companyNameEn: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'CR number must be 10 digits' })
  crNumber: string;

  @ApiProperty({ enum: CompanyType })
  @IsEnum(CompanyType)
  companyType: CompanyType;

  @ApiPropertyOptional({ example: 'Riyadh' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+966501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  // ── User ─────────────────────────────────────────────
  @ApiProperty({ example: 'Mohammed Al-Rashid' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'admin@elitetrading.sa' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@1234' })
  @IsString()
  @MinLength(8)
  password: string;
}
