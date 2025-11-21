import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderTimeline } from 'src/schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderUserDashboardService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async getTimelineByOrderId(id: string): Promise<OrderTimeline[]> {
    const order = await this.orderModel.findById(id).select('timeline').exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order.timeline;
  }

  async getOrderDetails(orderId: string, lang: 'ar' | 'en' = 'ar') {
    const objectId = new Types.ObjectId(orderId);
    const langKey = lang === 'en' ? 'en' : 'ar';
    const fallbackLang = 'en';

    const pipeline = [
      { $match: { _id: objectId, isDeleted: false } },

      // 🔗 ربط المستخدم
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      // 🔗 ربط الخدمة
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

      // 🔗 إذا كانت الخدمة مرتبطة بمقدم خدمة
      {
        $lookup: {
          from: 'providers',
          localField: 'service.provider', // تأكد من اسم الحقل الصحيح
          foreignField: '_id',
          as: 'provider',
        },
      },
      { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },

      // 🌍 ترجمة الحقول متعددة اللغات (title, description)
      {
        $addFields: {
          'service.title': {
            $ifNull: [
              `$service.title.${langKey}`,
              `$service.title.${fallbackLang}`,
            ],
          },
          'service.description': {
            $ifNull: [
              `$service.description.${langKey}`,
              `$service.description.${fallbackLang}`,
            ],
          },
          // ⏳ الموعد المتوقع
          expectedDate: {
            $add: [
              '$orderDate',
              {
                $multiply: ['$service.MaxCompletionDays', 24 * 60 * 60 * 1000],
              },
            ],
          },
        },
      },

      // 🔗 جلب المحادثة المرتبطة بالطلب وعدد الرسائل
      {
        $lookup: {
          from: 'chats',
          localField: '_id',
          foreignField: 'order',
          as: 'chat',
        },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'chat._id',
          foreignField: 'chat',
          as: 'messages',
        },
      },
      {
        $addFields: {
          messagesCount: { $size: '$messages' },
          unreadMessagesCount: {
            $size: {
              $filter: {
                input: '$messages',
                cond: { $eq: ['$$this.isRead', false] },
              },
            },
          },
        },
      },

      // 🔗 عد الملفات وعدد الملفات المعتمدة
      {
        $addFields: {
          totalFiles: { $size: '$documentsUrl' },
          approvedFilesCount: {
            $size: {
              $filter: {
                input: '$documentsUrl',
                cond: { $eq: ['$$this.status', 'approved'] },
              },
            },
          },
        },
      },

      // 🧮 Projection النهائي
      {
        $project: {
          _id: 1,
          orderNumber: 1,
          price: 1,
          status: 1,
          clientStage: 1,
          priority: 1,
          notes: 1,
          orderDate: 1,
          expectedDate: 1,
          timeline: 1,
          documentsUrl: 1,
          totalFiles: 1,
          approvedFilesCount: 1,
          messagesCount: 1,
          unreadMessagesCount: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: 1,
            fullName: 1,
            email: 1,
            phone: 1,
            loyaltyPoints: 1,
            loyaltyPointsLevel: 1,
          },
          service: {
            _id: 1,
            title: 1,
            description: 1,
            ministry: 1,
            image: 1,
            price: 1,
            categoryId: 1,
            MinCompletionDays: 1,
            MaxCompletionDays: 1,
          },
          provider: {
            _id: 1,
            fullName: 1,
            email: 1,
            phone: 1,
            status: 1,
          },
        },
      },
    ];

    const result = await this.orderModel.aggregate(pipeline).exec();

    if (!result || result.length === 0) {
      throw new NotFoundException('الطلب غير موجود أو تم حذفه.');
    }

    return result[0];
  }
}
