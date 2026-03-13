import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { AppealStatus, Role, SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AdminRespondAppealDto } from '../appeals/dto/admin-respond-appeal.dto';

class SetPlanDto {
  @ApiProperty({ enum: SubscriptionPlan }) @IsEnum(SubscriptionPlan) plan: SubscriptionPlan;
}

class ModerationActionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
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

  // ─── Admin Listings ────────────────────────────────────────────────────────

  @Get('listings')
  @ApiOperation({ summary: 'List all listings (admin view, all moderation statuses)' })
  getAdminListings(@Query() query: PaginationDto & { search?: string; moderationStatus?: string }) {
    return this.adminService.getAdminListings(query);
  }

  // ─── Content Moderation — RFQs ────────────────────────────────────────────

  @Patch('rfqs/:id/remove')
  @ApiOperation({ summary: 'Remove an RFQ from public view' })
  removeRFQ(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.moderateRFQ(id, 'remove', dto.reason, adminUserId);
  }

  @Patch('rfqs/:id/restore')
  @ApiOperation({ summary: 'Restore a moderated RFQ' })
  restoreRFQ(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.moderateRFQ(id, 'restore', undefined, adminUserId);
  }

  @Patch('rfqs/:id/flag')
  @ApiOperation({ summary: 'Flag an RFQ for review' })
  flagRFQ(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.moderateRFQ(id, 'flag', dto.reason, adminUserId);
  }

  // ─── Content Moderation — Listings ────────────────────────────────────────

  @Patch('listings/:id/remove')
  @ApiOperation({ summary: 'Remove a listing from public view' })
  removeListing(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.moderateListing(id, 'remove', dto.reason, adminUserId);
  }

  @Patch('listings/:id/restore')
  @ApiOperation({ summary: 'Restore a moderated listing' })
  restoreListing(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.moderateListing(id, 'restore', undefined, adminUserId);
  }

  @Patch('listings/:id/flag')
  @ApiOperation({ summary: 'Flag a listing for review' })
  flagListing(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.moderateListing(id, 'flag', dto.reason, adminUserId);
  }

  // ─── Moderation queue ─────────────────────────────────────────────────────

  @Get('moderation')
  @ApiOperation({ summary: 'Get flagged/removed content queue' })
  getFlagged(@Query() query: PaginationDto) {
    return this.adminService.getFlaggedContent(query);
  }

  // ─── Appeals ──────────────────────────────────────────────────────────────

  @Get('appeals')
  @ApiOperation({ summary: 'List all moderation appeals' })
  getAppeals(@Query() query: PaginationDto & { status?: AppealStatus }) {
    return this.adminService.getAppeals(query);
  }

  @Get('appeals/:id')
  @ApiOperation({ summary: 'Get a specific appeal' })
  getAppeal(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.getAppeal(id, adminUserId);
  }

  @Patch('appeals/:id/respond')
  @ApiOperation({ summary: 'Respond to an appeal (sets UNDER_REVIEW)' })
  respondAppeal(
    @Param('id') id: string,
    @Body() dto: AdminRespondAppealDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.respondAppeal(id, dto, adminUserId);
  }

  @Patch('appeals/:id/accept')
  @ApiOperation({ summary: 'Accept an appeal (restores content to ACTIVE)' })
  acceptAppeal(
    @Param('id') id: string,
    @Body() dto: AdminRespondAppealDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.acceptAppeal(id, dto, adminUserId);
  }

  @Patch('appeals/:id/reject')
  @ApiOperation({ summary: 'Reject an appeal' })
  rejectAppeal(
    @Param('id') id: string,
    @Body() dto: AdminRespondAppealDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.rejectAppeal(id, dto, adminUserId);
  }
}
