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
    if (userId) {
      matchStage.user = new Types.ObjectId(userId);
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users', // 👈 اسم مجموعة users
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $lookup: {
          from: 'serviceproviders', // 👈 اسم مجموعة serviceProviders
          localField: 'user',
          foreignField: '_id',
          as: 'providerData',
        },
      },
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
      {
        $sort: { createdAt: -1 },
      },
      { $skip: offset },
      { $limit: limit },
    ];

    if (role) {
      pipeline.unshift({
        $match: {
          'user.role': role,
        },
      });
    }

    return await this.activityModel.aggregate(pipeline);
  }
}
