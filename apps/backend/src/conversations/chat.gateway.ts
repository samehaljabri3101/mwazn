import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConversationsService } from './conversations.service';

interface JoinPayload {
  conversationId: string;
  userId: string;
}

interface MessagePayload {
  conversationId: string;
  userId: string;
  body: string;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly conversationsService: ConversationsService) {}

  afterInit() {
    this.logger.log('WebSocket Chat Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() payload: JoinPayload, @ConnectedSocket() client: Socket) {
    client.join(payload.conversationId);
    this.logger.debug(`User ${payload.userId} joined room ${payload.conversationId}`);
    return { event: 'joined', data: { conversationId: payload.conversationId } };
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() payload: MessagePayload, @ConnectedSocket() client: Socket) {
    try {
      const message = await this.conversationsService.sendMessage(
        payload.conversationId,
        payload.userId,
        payload.body,
      );
      // Emit to all room participants including sender
      this.server.to(payload.conversationId).emit('message', message);
      return { event: 'message_sent', data: message };
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() payload: TypingPayload, @ConnectedSocket() client: Socket) {
    // Broadcast to room (excluding sender)
    client.to(payload.conversationId).emit('typing', {
      userId: payload.userId,
      isTyping: payload.isTyping,
    });
  }
}
