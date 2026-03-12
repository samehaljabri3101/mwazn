import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterFreelancerDto {
  @ApiProperty({ example: 'Khalid Al-Otaibi' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({
    example: '1098765432',
    description: '10-digit Saudi National ID or Iqama number (optional)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'National ID / Iqama must be exactly 10 digits' })
  nationalId?: string;

  @ApiProperty({ example: 'khalid@freelance.sa' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'Dammam' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+966551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Full-stack developer specialising in Saudi e-commerce solutions.' })
  @IsOptional()
  @IsString()
  bio?: string;
}
