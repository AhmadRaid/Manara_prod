import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog } from 'src/schemas/activity-log.schema';
import { Provider } from 'src/schemas/serviceProvider.schema';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class ActivityLogAdminService {
  constructor(
    @InjectModel(ActivityLog.name)
    private readonly activityModel: Model<ActivityLog>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Provider.name) private readonly providerModel: Model<Provider>,
  ) {}

  // async getAllUserActivities(
  //   {
  //     userId,
  //     role,
  //     limit = 20,
  //     offset = 0,
  //   }: {
  //     userId?: string;
  //     role?: 'user' | 'provider';
  //     limit?: number;
  //     offset?: number;
  //   },
  //   lang: 'ar' | 'en' = 'ar',
  // ): Promise<any> {
  //   const matchStage: Record<string, any> = {};

  //   // ✅ تحديد نوع المستخدم المطلوب (user / provider)
  //   if (userId && role) {
  //     if (role === 'user') {
  //       matchStage.user = new Types.ObjectId(userId);
  //     } else if (role === 'provider') {
  //       matchStage.provider = new Types.ObjectId(userId);
  //     }
  //   } else if (userId) {
  //     matchStage.$or = [
  //       { user: new Types.ObjectId(userId) },
  //       { provider: new Types.ObjectId(userId) },
  //     ];
  //   }

  //   // ✅ بناء الـ pipeline مع جميع العلاقات
  //   const pipeline: any[] = [
  //     { $match: matchStage },
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'user',
  //         foreignField: '_id',
  //         as: 'userData',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'serviceproviders',
  //         localField: 'provider',
  //         foreignField: '_id',
  //         as: 'providerData',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'services',
  //         localField: 'serviceId',
  //         foreignField: '_id',
  //         as: 'service',
  //       },
  //     },
  //     {
  //       $unwind: { path: '$service', preserveNullAndEmptyArrays: true }
  //     },
  //     {
  //       $lookup: {
  //         from: 'orders',
  //         localField: 'orderId',
  //         foreignField: '_id',
  //         as: 'order',
  //       },
  //     },
  //     {
  //       $unwind: { path: '$order', preserveNullAndEmptyArrays: true }
  //     },
  //     {
  //       $addFields: {
  //         user: {
  //           $cond: [
  //             { $gt: [{ $size: '$userData' }, 0] },
  //             { $arrayElemAt: ['$userData', 0] },
  //             { $arrayElemAt: ['$providerData', 0] },
  //           ],
  //         },
  //       },
  //     },
  //     { $project: { userData: 0, providerData: 0 } },
  //     { $sort: { createdAt: -1 } },
  //     { $skip: offset },
  //     { $limit: limit },
  //   ];

  //   // ✅ تنفيذ الاستعلام
  //   const activities = await this.activityModel.aggregate(pipeline);

  //   // ✅ تنسيق النتيجة بناءً على اللغة
  //   const finalFormatted = activities.map((activity) => {
  //     const formatted = { ...activity };

  //     if (activity.title && typeof activity.title === 'object') {
  //       formatted.title = activity.title[lang] || activity.title['ar'];
  //     }

  //     if (activity.description && typeof activity.description === 'object') {
  //       formatted.description =
  //         activity.description[lang] || activity.description['ar'];
  //     }

  //     // جلب بيانات الخدمة والطلب بشكل مختصر
  //     if (activity.service) {
  //       formatted.service = {
  //         _id: activity.service._id,
  //         title: activity.service.title,
  //         description: activity.service.description,
  //         price: activity.service.price,
  //       };
  //     }
  //     if (activity.order) {
  //       formatted.order = {
  //         _id: activity.order._id,
  //         orderNumber: activity.order.orderNumber,
  //         price: activity.order.price,
  //         status: activity.order.status,
  //       };
  //     }

  //     return formatted;
  //   });

  //   return finalFormatted;
  // }
}
