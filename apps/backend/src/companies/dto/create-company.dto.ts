import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() city?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() website?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() logoUrl?: string;
}
