import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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
}
