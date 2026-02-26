import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class VerifyCompanyDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  reason?: string;
}
