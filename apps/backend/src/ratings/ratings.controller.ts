import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

class CreateRatingDto {
  @ApiProperty() @IsString() dealId: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5) score: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

@ApiTags('Ratings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Get all ratings for a supplier (received)' })
  findBySupplier(@Param('supplierId') supplierId: string, @Query() query: PaginationDto) {
    return this.ratingsService.findBySupplier(supplierId, query);
  }

  @Get('buyer/:buyerId')
  @ApiOperation({ summary: 'Get all ratings for a buyer (received from suppliers)' })
  findForBuyer(@Param('buyerId') buyerId: string, @Query() query: PaginationDto) {
    return this.ratingsService.findForBuyer(buyerId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Rate a deal counterpart — buyer rates supplier, supplier rates buyer' })
  create(@Body() dto: CreateRatingDto, @CurrentUser('id') userId: string) {
    return this.ratingsService.create(dto.dealId, dto.score, dto.comment, userId);
  }

  @Patch(':id/dispute')
  @ApiOperation({ summary: 'Flag a received rating as disputed (supplier only)' })
  flagDisputed(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ratingsService.flagDisputed(id, userId);
  }
}
