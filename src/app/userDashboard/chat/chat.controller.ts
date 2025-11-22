import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';

@Controller('dashboard/chats')
@UseGuards(JwtAuthGuard)

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 💬 إرسال رسالة (إنشاء Chat تلقائيًا إن لم توجد)
  @Post('send')
  async sendMessage(
    @Body()
    body: {
      orderId: string;
      senderId: string;
      senderType: 'User' | 'Provider';
      content: string;
    },
  ) {
    return this.chatService.sendMessageWithAutoChat(
      body.orderId,
      body.senderId,
      body.senderType,
      body.content,
    );
  }

  // 📜 جلب جميع الرسائل الخاصة بطلب معين
  @Get(':orderId/:readerType/messages')
  async getMessages(
    @Param('orderId') orderId: string,
    @Param('readerType') readerType: 'User' | 'Provider',
  ) {
    return this.chatService.getMessagesByOrder(orderId, readerType);
  }

  // 👁️ تحديد الرسائل كمقروءة من قبل الطرف الحالي
  @Post(':orderId/read')
  async markAsRead(
    @Param('orderId') orderId: string,
    @Body() body: { readerType: 'User' | 'Provider' },
  ) {
    return this.chatService.markMessagesAsRead(orderId, body.readerType);
  }

  // 👤 جلب جميع المحادثات الخاصة بالمستخدم (العميل)
  @Get('user/:userId')
  async getChatsForUser(@Param('userId') userId: string) {
    return this.chatService.getChatsForUser(userId);
  }

  // 🧑‍💼 جلب جميع المحادثات الخاصة بمقدم الخدمة
  @Get('provider/:providerId')
  async getChatsForProvider(@Param('providerId') providerId: string) {
    return this.chatService.getChatsForProvider(providerId);
  }
}
