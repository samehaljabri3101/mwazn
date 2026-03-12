import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @ApiProperty({ example: 'Sara Al-Qahtani' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'sara@personal.sa' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'Riyadh' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+966551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '1098765432',
    description: '10-digit Saudi National ID number (optional)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'National ID must be exactly 10 digits' })
  nationalId?: string;
}
