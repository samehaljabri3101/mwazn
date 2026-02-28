import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

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

  @ApiProperty({ example: 'admin@horizonprocurement.sa' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
