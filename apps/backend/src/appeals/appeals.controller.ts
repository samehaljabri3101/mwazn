import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppealsService } from './appeals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';

@ApiTags('Appeals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('appeals')
export class AppealsController {
  constructor(private readonly appealsService: AppealsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a moderation appeal for an RFQ or listing' })
  create(
    @Body() dto: CreateAppealDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appealsService.create(dto, userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my appeals' })
  getMyAppeals(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationDto,
  ) {
    return this.appealsService.findMyAppeals(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific appeal (owner or admin)' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appealsService.findOne(id, userId);
  }
}
