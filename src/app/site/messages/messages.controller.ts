import { Controller, Get, Post, Body, Param, Req, Patch } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Body() createMessageDto: CreateMessageDto, @Req() req: any) {
    // افترض أن معرف المستخدم المرسل يتم جلبه من التوكن
    const senderId = req.user.userId; 
    return this.messagesService.create(createMessageDto, senderId);
  }

  // GET /messages/:otherUserId
  // للحصول على سجل المحادثة مع مستخدم آخر
  @Get(':otherUserId')
  async getConversation(@Param('otherUserId') otherUserId: string, @Req() req: any) {
    const currentUserId = req.user.userId;
    // استرجاع المحادثة
    const conversation = await this.messagesService.getConversation(currentUserId, otherUserId);
    
    // وضع علامة "مقروءة" على الرسائل التي استقبلها المستخدم الحالي
    await this.messagesService.markAsRead(otherUserId, currentUserId);
    
    return conversation;
  }
  
  // GET /messages/unread/count
  // للحصول على عدد الرسائل غير المقروءة (لإظهار الإشعارات)
  @Get('unread/count')
  getUnreadCount(@Req() req: any) {
    const currentUserId = req.user.userId;
    return this.messagesService.getUnreadCount(currentUserId);
  }
}