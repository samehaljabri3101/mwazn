import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DealStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

class UpdateDealStatusDto {
  @ApiProperty({ enum: DealStatus }) @IsEnum(DealStatus) status: DealStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

@ApiTags('Deals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'List my deals' })
  @ApiQuery({ name: 'status', enum: DealStatus, required: false })
  findAll(@CurrentUser('id') userId: string, @Query() query: PaginationDto & { status?: DealStatus }) {
    return this.dealsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal details' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dealsService.findOne(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deal status (lifecycle transition)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDealStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dealsService.updateStatus(id, dto.status, userId, dto.notes);
  }
}
