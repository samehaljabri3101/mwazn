import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'مواد البناء' })
  @IsString() @IsNotEmpty() nameAr: string;

  @ApiProperty({ example: 'Building Materials' })
  @IsString() @IsNotEmpty() nameEn: string;

  @ApiProperty({ example: 'building-materials' })
  @IsString() @IsNotEmpty() slug: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() iconUrl?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() parentId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() iconUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
