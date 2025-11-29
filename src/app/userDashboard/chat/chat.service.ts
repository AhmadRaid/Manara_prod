import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat } from 'src/schemas/chat.schema';
import { Message } from 'src/schemas/message.schema';
import { Order } from 'src/schemas/order.schema';
import { Service } from 'src/schemas/service.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
  ) {}

  // ✅ إنشاء أو استرجاع المحادثة بناء على orderId
  async createOrGetChat(orderId: string): Promise<Chat> {
    // 1️⃣ جلب الطلب مع مزود الخدمة باستخدام aggregation
    const orders = await this.orderModel.aggregate([
      { $match: { _id: new Types.ObjectId(orderId) } },
      {
        $lookup: {
          from: 'services', // اسم collection الخدمات
          localField: 'service', // الحقل في الطلب
          foreignField: '_id', // الحقل المقابل في service
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          user: 1,
          service: 1,
        },
      },
    ]);

    console.log('111111111111', orders);

    const order = orders[0];

    if (!order) throw new NotFoundException('الطلب غير موجود.');

    const userId = order.user;
    const providerId = order.service.provider;

    if (!userId || !providerId) {
      throw new BadRequestException(
        'تعذر تحديد العميل أو مزود الخدمة من الطلب.',
      );
    }

    // 2️⃣ البحث عن محادثة موجودة مسبقًا
    let chat = await this.chatModel.findOne({
      order: order._id,
      user: userId,
      provider: providerId,
    });

    // 3️⃣ إنشاء محادثة جديدة إذا لم توجد
    if (!chat) {
      chat = await this.chatModel.create({
        order: order._id,
        user: userId,
        provider: providerId,
      });
    }

    return chat;
  }

  // ✅ إرسال رسالة (إنشاء Chat تلقائيًا إن لم يوجد)
  async sendMessageWithAutoChat(
    orderId: string,
    senderId: string,
    senderType: 'User' | 'Provider',
    content: string,
  ) {
    if (!orderId || !senderId || !senderType || !content) {
      throw new BadRequestException('البيانات المدخلة غير مكتملة.');
    }

    const chat = await this.createOrGetChat(orderId);

    // 🔁 تحديد المستلم بناء على senderType
    const receiverId = senderType === 'User' ? chat.provider : chat.user;

    // ✅ إنشاء الرسالة
    const message = await this.messageModel.create({
      chat: chat._id,
      sender: new Types.ObjectId(senderId),
      senderType,
      receiver: receiverId,
      content,
    });

    // ✅ تحديث بيانات المحادثة
    chat.lastMessage = content;
    chat.lastMessageAt = new Date();

    if (senderType === 'User') {
      chat.hasUnreadMessagesForProvider = true;
    } else {
      chat.hasUnreadMessagesForUser = true;
    }

    await chat.save();

    return { chat, message };
  }

  // ✅ جلب جميع الرسائل الخاصة بطلب معين
  async getMessagesByOrder(orderId: string, readerType: 'User' | 'Provider') {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('رقم الطلب غير صالح.');
    }

    const chat = await this.chatModel.findOne({
      order: new Types.ObjectId(orderId),
    });
    if (!chat) return 'لا توجد محادثة لهذا الطلب.';

    const chatId = chat._id as Types.ObjectId;

    const messages = await this.messageModel.aggregate([
      { $match: { chat: chatId } },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'userSender',
        },
      },
      {
        $lookup: {
          from: 'providers',
          localField: 'sender',
          foreignField: '_id',
          as: 'providerSender',
        },
      },
      {
        $addFields: {
          senderInfo: {
            $cond: [
              { $eq: ['$senderType', 'User'] },
              { $arrayElemAt: ['$userSender', 0] },
              { $arrayElemAt: ['$providerSender', 0] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          isRead: 1,
          createdAt: 1,
          senderType: 1,
          'senderInfo._id': 1,
          'senderInfo.fullName': 1,
          'senderInfo.email': 1,
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    await this.markMessagesAsRead(orderId, readerType);

    return messages;
  }

   async getMessagesByOrderAsAdmin(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('رقم الطلب غير صالح.');
    }

    const chat = await this.chatModel.findOne({
      order: new Types.ObjectId(orderId),
    });
    if (!chat) return 'لا توجد محادثة لهذا الطلب.';

    const chatId = chat._id as Types.ObjectId;

    const messages = await this.messageModel.aggregate([
      { $match: { chat: chatId } },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'userSender',
        },
      },
      {
        $lookup: {
          from: 'providers',
          localField: 'sender',
          foreignField: '_id',
          as: 'providerSender',
        },
      },
      {
        $addFields: {
          senderInfo: {
            $cond: [
              { $eq: ['$senderType', 'User'] },
              { $arrayElemAt: ['$userSender', 0] },
              { $arrayElemAt: ['$providerSender', 0] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          isRead: 1,
          createdAt: 1,
          senderType: 1,
          'senderInfo._id': 1,
          'senderInfo.fullName': 1,
          'senderInfo.email': 1,
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    return messages;
  }

  // ✅ تحديد جميع الرسائل كمقروءة
  async markMessagesAsRead(orderId: string, readerType: 'User' | 'Provider') {
    const chat = await this.chatModel.findOne({
      order: new Types.ObjectId(orderId),
    });
    if (!chat) throw new NotFoundException('المحادثة غير موجودة.');

    await this.messageModel.updateMany(
      {
        chat: chat._id,
        senderType: readerType === 'User' ? 'Provider' : 'User',
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    if (readerType === 'User') chat.hasUnreadMessagesForUser = false;
    else chat.hasUnreadMessagesForProvider = false;

    await chat.save();

    return { message: 'تم تحديد جميع الرسائل كمقروءة بنجاح.' };
  }

  // ✅ جلب المحادثات الخاصة بالمستخدم
  async getChatsForUser(userId: string) {
    return this.chatModel
      .find({ user: userId, isDeleted: false })
      .populate([
        { path: 'provider', select: 'fullName email phone' },
        { path: 'order', select: 'orderNumber status price' },
      ])
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  // ✅ جلب المحادثات الخاصة بمقدم الخدمة
  async getChatsForProvider(providerId: string) {
    return this.chatModel
      .find({ provider: providerId, isDeleted: false })
      .populate([
        { path: 'user', select: 'fullName email phone' },
        { path: 'order', select: 'orderNumber status price' },
      ])
      .sort({ lastMessageAt: -1 })
      .exec();
  }
}
