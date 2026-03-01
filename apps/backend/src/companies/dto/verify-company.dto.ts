import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class VerifyCompanyDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Reason for rejection or admin review note' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Internal admin notes (stored on company)' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
