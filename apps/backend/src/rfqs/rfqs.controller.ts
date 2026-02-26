import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RFQStatus } from '@prisma/client';
import { RFQsService } from './rfqs.service';
import { CreateRFQDto, UpdateRFQDto } from './dto/rfq.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('RFQs')
@Controller('rfqs')
export class RFQsController {
  constructor(private readonly rfqsService: RFQsService) {}

  @Get()
  @ApiOperation({ summary: 'List open RFQs (suppliers browse)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', enum: RFQStatus, required: false })
  findAll(@Query() query: PaginationDto & { categoryId?: string; status?: RFQStatus }) {
    return this.rfqsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my company\'s RFQs (buyer)' })
  getMyRFQs(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    return this.rfqsService.getMyRFQs(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ details' })
  findOne(@Param('id') id: string) {
    return this.rfqsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create RFQ (buyer only)' })
  create(@Body() dto: CreateRFQDto, @CurrentUser('id') userId: string) {
    return this.rfqsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update RFQ' })
  update(@Param('id') id: string, @Body() dto: UpdateRFQDto, @CurrentUser('id') userId: string) {
    return this.rfqsService.update(id, dto, userId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel RFQ' })
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.rfqsService.cancel(id, userId);
  }
}
