import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string, query: PaginationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { participants: { some: { id: user?.companyId } } },
        skip: query.skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          participants: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.conversation.count({
        where: { participants: { some: { id: user?.companyId } } },
      }),
    ]);

    return paginate(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOrCreate(userId: string, targetCompanyId: string, subject?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const myCompanyId = user?.companyId;
    if (!myCompanyId) throw new ForbiddenException();

    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: myCompanyId } } },
          { participants: { some: { id: targetCompanyId } } },
        ],
      },
      include: { participants: { select: { id: true, nameAr: true, nameEn: true } } },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        subject,
        participants: { connect: [{ id: myCompanyId }, { id: targetCompanyId }] },
      },
      include: { participants: { select: { id: true, nameAr: true, nameEn: true } } },
    });
  }

  async getMessages(conversationId: string, userId: string, query: PaginationDto) {
    await this.assertParticipant(conversationId, userId);

    // Mark messages as read
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true, companyId: true } },
          attachments: true,
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return paginate(items.reverse(), total, query.page ?? 1, query.limit ?? 20);
  }

  async sendMessage(conversationId: string, userId: string, body: string) {
    await this.assertParticipant(conversationId, userId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true, companyId: true } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { id: user?.companyId } } },
      select: { id: true },
    });
    const ids = conversations.map((c) => c.id);
    const count = await this.prisma.message.count({
      where: { conversationId: { in: ids }, senderId: { not: userId }, isRead: false },
    });
    return { unread: count };
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some((p) => p.id === user?.companyId)) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
  }
}
