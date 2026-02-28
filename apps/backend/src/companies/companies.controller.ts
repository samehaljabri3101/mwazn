import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CompanyType, Role, VerificationStatus } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/create-company.dto';
import { VerifyCompanyDto } from './dto/verify-company.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all companies (admin only)' })
  @ApiQuery({ name: 'type', enum: CompanyType, required: false })
  @ApiQuery({ name: 'status', enum: VerificationStatus, required: false })
  findAll(@Query() query: PaginationDto & { type?: CompanyType; status?: VerificationStatus }) {
    return this.companiesService.findAll(query);
  }

  @Get('pending-verification')
  @Roles(Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List suppliers pending verification' })
  getPending() {
    return this.companiesService.getPendingSuppliers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company details' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Get(':id/showroom')
  @Public()
  @ApiOperation({ summary: 'Get supplier public showroom (no auth required)' })
  getShowroom(@Param('id') id: string) {
    return this.companiesService.getShowroom(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company info (own company or admin)' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, userId, dto);
  }

  @Patch(':id/verify')
  @Roles(Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Verify or reject a supplier (admin only)' })
  verify(@Param('id') id: string, @Body() dto: VerifyCompanyDto) {
    return this.companiesService.verify(id, dto);
  }
}
