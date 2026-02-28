import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

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

  @ApiProperty({ example: 'admin@elitesupply.sa' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
