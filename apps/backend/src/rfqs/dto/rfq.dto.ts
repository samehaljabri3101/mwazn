import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RFQStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export enum RFQProjectType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  MANUFACTURING = 'MANUFACTURING',
  CONSULTANCY = 'CONSULTANCY',
}

export enum RFQVisibility {
  PUBLIC = 'PUBLIC',
  INVITE_ONLY = 'INVITE_ONLY',
}

export class CreateRFQDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty() @IsString() @IsNotEmpty() categoryId: string;

  @ApiPropertyOptional({ enum: RFQProjectType })
  @IsOptional() @IsEnum(RFQProjectType) projectType?: RFQProjectType;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;

  @ApiPropertyOptional({ default: 'SAR' }) @IsOptional() @IsString() currency?: string;

  // Budget: single value OR range
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() budget?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetMax?: number;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() budgetUndisclosed?: boolean;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() vatIncluded?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expectedStartDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() locationRequirement?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() siteVisitRequired?: boolean;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() ndaRequired?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) requiredCertifications?: string[];

  @ApiPropertyOptional({ enum: RFQVisibility, default: 'PUBLIC' })
  @IsOptional() @IsEnum(RFQVisibility) visibility?: RFQVisibility;

  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() allowPartialBids?: boolean;
}

export class UpdateRFQDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional({ enum: RFQProjectType }) @IsOptional() @IsEnum(RFQProjectType) projectType?: RFQProjectType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() budget?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() budgetUndisclosed?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() vatIncluded?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expectedStartDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationRequirement?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() siteVisitRequired?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() ndaRequired?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) requiredCertifications?: string[];
  @ApiPropertyOptional({ enum: RFQVisibility }) @IsOptional() @IsEnum(RFQVisibility) visibility?: RFQVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowPartialBids?: boolean;
  @ApiPropertyOptional({ enum: RFQStatus }) @IsOptional() @IsEnum(RFQStatus) status?: RFQStatus;
}
