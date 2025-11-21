import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, MessageDocument } from 'src/schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  // 1. إنشاء رسالة جديدة
  async create(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
    const createdMessage = new this.messageModel({
      ...createMessageDto,
      sender: senderId,
      receiver: createMessageDto.receiverId,
    });
    return createdMessage.save();
  }

  // 2. الحصول على سجل محادثة بين مستخدمين
  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
      })
      .sort({ createdAt: 1 }) // ترتيب الرسائل تصاعدياً حسب الوقت
      .exec();
  }
  
  // 3. تحديث الرسائل كـ 'مقروءة'
  async markAsRead(senderId: string, receiverId: string): Promise<any> {
    // تحديث الرسائل التي أرسلها المستخدم الأول واستقبلها المستخدم الثاني
    return this.messageModel.updateMany(
      { sender: senderId, receiver: receiverId, isRead: false },
      { $set: { isRead: true } },
    );
  }

  // 4. الحصول على الرسائل غير المقروءة لمستخدم معين (اختياري)
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({ receiver: userId, isRead: false }).exec();
  }
}