import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { Role, SubscriptionPlan } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

class SetPlanDto {
  @ApiProperty({ enum: SubscriptionPlan }) @IsEnum(SubscriptionPlan) plan: SubscriptionPlan;
}

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PLATFORM_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('pending-verifications')
  @ApiOperation({ summary: 'List suppliers pending verification' })
  getPending(@Query() query: PaginationDto) {
    return this.adminService.getPendingVerifications(query);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Platform audit logs' })
  getAuditLogs(@Query() query: PaginationDto & { entity?: string }) {
    return this.adminService.getAuditLogs(query);
  }

  @Patch('companies/:id/plan')
  @ApiOperation({ summary: 'Set company subscription plan (FREE/PRO)' })
  setPlan(
    @Param('id') companyId: string,
    @Body() dto: SetPlanDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.setPlan(companyId, dto.plan, adminUserId);
  }
}
