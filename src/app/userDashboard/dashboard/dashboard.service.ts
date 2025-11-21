// src/app/site/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../../../schemas/order.schema';
import { User } from '../../../schemas/user.schema';
import { ActivityLog } from '../../../schemas/activity-log.schema';
import { ActivityLogUserService } from 'src/app/userDashboard/activity-log/activity-log.service';

// واجهة لإحصائيات الطلبات فقط
export interface OrderStats {
  totalOrders: number;
  inProgressOrders: number;
  completedOrders: number;
}

// واجهة ملخص لوحة التحكم (الإحصائيات ونقاط الولاء والأنشطة)
export interface DashboardSummary extends OrderStats {
  loyaltyPoints: number;
  latestActivities: ActivityLog[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly activityLogService: ActivityLogUserService,
  ) {}

  /**
   * يحسب إحصائيات الطلبات (الإجمالي، قيد التنفيذ، المكتملة) لمستخدم معين باستخدام Mongoose Aggregate.
   */
  private async getOrderStats(
    userId: Types.ObjectId | string,
  ): Promise<OrderStats> {
    const results = await this.orderModel.aggregate([
      // 1. تصفية الطلبات حسب المستخدم
      { $match: { user: new Types.ObjectId(userId) } },
      // 2. تجميع وحساب الإحصائيات
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          inProgressOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['In_progress', 'Awaiting_Approval']] },
                1,
                0,
              ],
            },
          },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
        },
      },
      // 3. إعادة هيكلة البيانات
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          inProgressOrders: 1,
          completedOrders: 1,
        },
      },
    ]);

    // إرجاع النتيجة أو القيم الافتراضية إذا لم يتم العثور على طلبات
    return (
      results[0] || { totalOrders: 0, inProgressOrders: 0, completedOrders: 0 }
    );
  }

  /**
   * يجلب ملخص لوحة التحكم (الإحصائيات ونقاط الولاء وآخر 3 أنشطة).
   */
  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const [orderStats, loyaltyPoints, latestActivities] = await Promise.all([
      this.getOrderStats(userId),
      this.getLoyaltyPoints(userId),
      this.activityLogService.getLatestActivities(userId, 3),
    ]);

    return {
      ...orderStats,
      loyaltyPoints,
      latestActivities,
    };
  }

  /**
   * يجلب نقاط الولاء للمستخدم.
   */
  private async getLoyaltyPoints(userId: string): Promise<number> {
    const user = await this.userModel
      .findById(userId)
      .select('loyaltyPoints')
      .exec();
    return user?.loyaltyPoints || 0;
  }

  async getLatestOrders(userId: string, lang: string): Promise<any[]> {
    const objectId = new Types.ObjectId(userId);

    const expectedCompletionDateFields = {
      $addFields: {
        maxDaysInMs: {
          $multiply: ['$serviceDetails.MaxCompletionDays', 24 * 60 * 60 * 1000],
        },
        maxExpectedDate: {
          $add: [
            '$orderDate',
            {
              $multiply: [
                '$serviceDetails.MaxCompletionDays',
                24 * 60 * 60 * 1000,
              ],
            },
          ],
        },
      },
    };

    const remainingDaysField = {
      $addFields: {
        remainingDays: {
          $dateDiff: {
            startDate: new Date(),
            endDate: '$maxExpectedDate',
            unit: 'day',
          },
        },
      },
    };

    const pipeline: any[] = [
      { $match: { user: objectId } },
      { $sort: { orderDate: -1 } },
      { $limit: 3 },

      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceDetails',
        },
      },

      {
        $unwind: { path: '$serviceDetails', preserveNullAndEmptyArrays: true },
      },

      // ** 1. إضافة التاريخ المتوقع للإنجاز **
      expectedCompletionDateFields,

      // ** 2. حساب الأيام المتبقية (اعتمادًا على تاريخ اليوم) **
      remainingDaysField,

      {
        $project: {
          _id: 1,

          orderNumber: 1,
          price: 1,
          status: 1,
          priority: 1,
          clientStage: 1,
          orderDate: 1,
          serviceTitle: `$serviceDetails.title.${lang}`,
          serviceMinistry: '$serviceDetails.ministry',
          remainingDays: 1,
        },
      },
    ];

    // تنفيذ الـ Aggregation
    const orders = await this.orderModel.aggregate(pipeline).exec();

    return orders;
  }
}
