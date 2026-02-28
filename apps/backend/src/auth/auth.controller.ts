import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterFreelancerDto } from './dto/register-freelancer.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
}

class ChangePasswordDto {
  @ApiProperty() @IsString() currentPassword: string;
  @ApiProperty() @IsString() @MinLength(8) newPassword: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new company and admin user (legacy — use typed endpoints below)' })
  @ApiResponse({ status: 201, description: 'Returns tokens + user + company' })
  @ApiResponse({ status: 409, description: 'Email or CR already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/supplier')
  @ApiOperation({ summary: 'Register a new supplier company and its admin user' })
  @ApiResponse({ status: 201, description: 'Returns tokens + user + company (verificationStatus: PENDING)' })
  @ApiResponse({ status: 409, description: 'Email or CR number already registered' })
  registerSupplier(@Body() dto: RegisterSupplierDto) {
    return this.authService.registerSupplier(dto);
  }

  @Post('register/buyer')
  @ApiOperation({ summary: 'Register a new buyer company and its admin user' })
  @ApiResponse({ status: 201, description: 'Returns tokens + user + company (verificationStatus: VERIFIED)' })
  @ApiResponse({ status: 409, description: 'Email or CR number already registered' })
  registerBuyer(@Body() dto: RegisterBuyerDto) {
    return this.authService.registerBuyer(dto);
  }

  @Post('register/freelancer')
  @ApiOperation({ summary: 'Register an individual freelancer using National ID / Iqama' })
  @ApiResponse({ status: 201, description: 'Returns tokens + user + profile (verificationStatus: PENDING)' })
  @ApiResponse({ status: 409, description: 'Email or National ID already registered' })
  registerFreelancer(@Body() dto: RegisterFreelancerDto) {
    return this.authService.registerFreelancer(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns tokens + user + company' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@CurrentUser() user: { userId: string; refreshToken: string }) {
    return this.authService.refresh(user.userId, user.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  logout(@CurrentUser('id') userId: string, @Body() body: Partial<RefreshTokenDto>) {
    return this.authService.logout(userId, body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user profile (fullName, avatarUrl)' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }
}
