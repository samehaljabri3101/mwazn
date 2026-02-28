import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { CompanyType } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ example: 'شركة النخبة التجارية' })
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiProperty({ example: 'Elite Trading Co.' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'CR number must be 10 digits' })
  crNumber: string;

  @ApiProperty({ enum: CompanyType })
  @IsEnum(CompanyType)
  type: CompanyType;

  @ApiPropertyOptional({ example: 'Riyadh' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+966501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.sa' })
  @IsOptional()
  @IsString()
  website?: string;
}
