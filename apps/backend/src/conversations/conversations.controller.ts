import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

class StartConversationDto {
  @ApiProperty() @IsString() @IsNotEmpty() targetCompanyId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
}

class SendMessageDto {
  @ApiProperty() @IsString() @IsNotEmpty() body: string;
}

@ApiTags('Conversations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my conversations' })
  findMine(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    return this.conversationsService.findMine(userId, query);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread message count' })
  unread(@CurrentUser('id') userId: string) {
    return this.conversationsService.getUnreadCount(userId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start or retrieve conversation with another company' })
  start(@Body() dto: StartConversationDto, @CurrentUser('id') userId: string) {
    return this.conversationsService.findOrCreate(userId, dto.targetCompanyId, dto.subject);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (polling)' })
  getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query() query: PaginationDto,
  ) {
    return this.conversationsService.getMessages(id, userId, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  send(@Param('id') id: string, @Body() dto: SendMessageDto, @CurrentUser('id') userId: string) {
    return this.conversationsService.sendMessage(id, userId, dto.body);
  }
}
