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

  async getAllUserActivities({
    userId,
    role,
    limit = 20,
    offset = 0,
  }: {
    userId?: string;
    role?: 'user' | 'provider';
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const matchStage: Record<string, any> = {};

    console.log('11111',userId,role);
    

    if (userId && role) {
      if (role == 'user') {
        matchStage.user = new Types.ObjectId(userId);
      } else if (role == 'provider') {
        matchStage.provider = new Types.ObjectId(userId);
      }
    } else if (userId) {
      // إذا لم يُرسل role، حاول البحث في كلا الحقلين
      matchStage.$or = [
        { user: new Types.ObjectId(userId) },
        { provider: new Types.ObjectId(userId) },
      ];
    }

    const pipeline: any[] = [
      { $match: matchStage },

      // دمج بيانات المستخدم
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },

      // دمج بيانات المزود
      {
        $lookup: {
          from: 'serviceproviders',
          localField: 'provider',
          foreignField: '_id',
          as: 'providerData',
        },
      },

      // اختيار أي حقل موجود للعرض
      {
        $addFields: {
          user: {
            $cond: [
              { $gt: [{ $size: '$userData' }, 0] },
              { $arrayElemAt: ['$userData', 0] },
              { $arrayElemAt: ['$providerData', 0] },
            ],
          },
        },
      },

      { $project: { userData: 0, providerData: 0 } },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
    ];

    return await this.activityModel.aggregate(pipeline);
  }
}
