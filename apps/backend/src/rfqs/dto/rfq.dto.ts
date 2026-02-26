import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { RFQStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateRFQDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty() @IsString() @IsNotEmpty() categoryId: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() budget?: number;
  @ApiPropertyOptional({ default: 'SAR' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
}

export class UpdateRFQDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() budget?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional({ enum: RFQStatus }) @IsOptional() @IsEnum(RFQStatus) status?: RFQStatus;
}
