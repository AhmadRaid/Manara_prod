import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderTimeline, TIMELINE_STEPS } from 'src/schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Service } from 'src/schemas/service.schema';
import { ActivityLogUserService } from '../activity-log/activity-log.service';
import { Provider } from 'src/schemas/serviceProvider.schema';
import { User } from 'src/schemas/user.schema';
import { PointsHistory } from 'src/schemas/pointsHistory.schema';
import { CreateOrderStep1Dto } from 'src/app/site/order/dto/create-order-step1.dto';
import { ActivityLog } from 'src/schemas/activity-log.schema';
import { changeNotifcationOrderDto } from './dto/change-notification-order.dto';

@Injectable()
export class OrderUserDashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Service.name) private serviceModel: Model<Service>,
    @InjectModel(Provider.name) private providerModel: Model<Provider>,
    private readonly activityLogService: ActivityLogUserService,
    @InjectModel('PointsHistory')
    private readonly pointsHistoryModel: Model<PointsHistory>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

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
          notificationsEnabled: 1,
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

  async redeemPointsForOrder(
    dto: CreateOrderStep1Dto,
    userId: string,
  ): Promise<Order> {
    const session = await this.orderModel.db.startSession();

    try {
      let newOrderResult;

      await session.withTransaction(async () => {
        const [user, service] = await Promise.all([
          this.userModel.findById(userId).session(session),
          this.serviceModel.findById(dto.serviceId).session(session),
        ]);

        if (!user) throw new NotFoundException('المستخدم غير موجود.');
        if (!service) throw new NotFoundException('الخدمة غير متوفرة.');

        const requiredPoints =
          service.loyaltyPoints || Math.floor(service.price);

        console.log('11111111111', requiredPoints, user.loyaltyPoints);

        if (user.loyaltyPoints < requiredPoints) {
          throw new BadRequestException('النقاط غير كافية.');
        }

        // خصم النقاط
        user.loyaltyPoints -= requiredPoints;
        user.loyaltyPointsUsed += requiredPoints;
        await user.save({ session });

        // سجل النقاط
        await this.pointsHistoryModel.create(
          [
            {
              user: new Types.ObjectId(userId),
              type: 'redeem',
              points: requiredPoints,
              source: 'استبدال نقاط لخدمة',
              serviceId: service._id,
            },
          ],
          { session },
        );

        // رقم الطلب
        const counterResult = await this.orderModel.db
          .collection('counters')
          .findOneAndUpdate(
            { name: 'orderNumber' },
            { $inc: { value: 1 } },
            { upsert: true, returnDocument: 'after', session },
          );

        const nextOrderNumber = counterResult.value ?? 1;

        // إنشاء timeline مخصص للدفع بالنقاط
        const customTimeline = [
          {
            step: 'تم انشاء الطلب',
            done: true,
            date: new Date(),
            notes: 'تم استلام طلبك وانشاء رقم التتبع',
          },
          {
            step: 'تم الدفع بنجاح',
            done: true,
            notes: 'تم الدفع عن طريق اسبتدال النقاط بنجاح',
          },
          {
            step: 'رفع المستندات',
            done: false,
            notes: 'تم رفع جميع المستندات المطلوبة',
          },
          {
            step: 'قيد المعالجة',
            done: false,
            notes: 'جار معالجة المستندات والتحقق منها',
          },
          {
            step: 'المعالجة النهائية',
            done: false,
            notes: 'سيتم معالجة الطلب والتحقق من النتائج.',
          },
        ];

        // إنشاء الطلب مع timeline مخصص
        const newOrder = await this.orderModel.create(
          [
            {
              user: new Types.ObjectId(userId),
              service: service._id,
              price: service.price,
              paymentMethod: 'points',
              status: 'in-progress',
              clientStage: 'step2_payment',
              orderNumber: `ORD-${nextOrderNumber}`,
              timeline: customTimeline,
              notificationsEnabled: true, // افتراضي مفعّل
            },
          ],
          { session },
        );

        // تحديث المستخدم ومزود الخدمة
        await this.userModel.updateOne(
          { _id: user._id },
          { $push: { order: newOrder[0]._id } },
          { session },
        );

        await this.providerModel.updateOne(
          { _id: service.provider },
          { $push: { orders: newOrder[0]._id } },
          { session },
        );

        newOrderResult = newOrder[0];
      });

      await session.endSession();

      // 🔹 سجل النشاط بعد نجاح الـ transaction
      await this.activityLogService.logActivity(
        new Types.ObjectId(userId),
        { ar: 'استبدال نقاط', en: 'Points Redeemed' },
        {
          ar: 'تم استبدال النقاط مقابل خدمة.',
          en: 'Points redeemed for a service.',
        },
      );

      return newOrderResult;
    } catch (err) {
      await session.endSession();
      throw err;
    }
  }

  // جلب إشعارات الطلب للعميل إذا كان التفعيل مفعّل
  async getOrderNotificationsByUserId(
    orderId: string,
    userId: string,
  ): Promise<any[]> {
    // جلب الطلب والتأكد من تفعيل الإشعارات
    const order = await this.orderModel
      .findById(orderId)
      .select('user notificationsEnabled')
      .exec();
    if (!order) throw new NotFoundException('الطلب غير موجود');
    // إذا لم يكن المستخدم هو صاحب الطلب
    if (order.user.toString() !== userId.toString())
      throw new BadRequestException('لا يمكنك جلب إشعارات لطلب لا تملكه');
    // إذا لم يكن التفعيل مفعّل
    if (!order.notificationsEnabled) return [];
    // جلب كل activity log المرتبطة بهذا الطلب والمستخدم عبر الخدمة
    return await this.activityLogService.getLogsForOrderAndUser(
      orderId,
      userId,
    );
  }

  async changeNotificationOrder(
    orderId: string,
    notificationsEnabled: boolean,
    userId: string,
  ): Promise<any> {
    // جلب الطلب والتأكد من ملكية المستخدم
    const order = await this.orderModel
      .findById(orderId)
      .select('user notificationsEnabled')
      .exec();
    if (!order) throw new NotFoundException('الطلب غير موجود');
    if (order.user.toString() !== userId.toString())
      throw new BadRequestException('لا يمكنك تعديل إشعارات لطلب لا تملكه');

    // تحديث حالة الإشعارات
    order.notificationsEnabled = notificationsEnabled == true ? true : false;
    await order.save();

    return { success: true, notificationsEnabled: order.notificationsEnabled };
  }

  // جلب كل إشعارات الطلبات للمستخدم والتي فيها notificationsEnabled = true
  async getAllOrderNotificationsByUserId(
    userId: string,
    lang: 'ar' | 'en' ,
  ): Promise<any[]> {
    // جلب كل الطلبات المرتبطة بالمستخدم والتي فيها notificationsEnabled = true
    const orders = await this.orderModel
      .find({
        user: new Types.ObjectId(userId),
        notificationsEnabled: true,
        isDeleted: { $ne: true },
      })
      .select('_id')
      .exec();

    const orderObjectIds = orders.map((order) => order._id as Types.ObjectId);
    if (orderObjectIds.length === 0) return [];

    // جلب كل activity logs المرتبطة بهذه الطلبات والمستخدم عبر الخدمة
    return this.activityLogService.getLogsForOrdersAndUser(
      orderObjectIds,
      userId,
      lang,
    );
  }
}
